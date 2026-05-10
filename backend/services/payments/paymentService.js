const crypto = require("crypto");
const db = require("../../config/db");

function newIdempotencyKey(prefix = "mm") {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

async function createGatewayBackedOrder({
  userId,
  subscriptionId,
  amount,
  currency = "INR",
  provider = "razorpay",
  gatewayOrderId,
}) {
  const idempotencyKey = newIdempotencyKey("order");

  // We keep using existing payments ledger row; create one if missing.
  // For now: create a new payment row tied to subscription.
  const [result] = await db.query(
    `INSERT INTO payments
      (user_id, subscription_id, total_amount, paid_amount, currency, status, idempotency_key, gateway_provider, gateway_order_id, gateway_status)
     VALUES (?, ?, ?, 0, ?, 'pending', ?, ?, ?, 'created')`,
    [userId, subscriptionId, amount, currency, idempotencyKey, provider, gatewayOrderId]
  );

  return { paymentId: result.insertId, idempotencyKey };
}

async function recordWebhookEvent({
  provider,
  externalEventId,
  eventType,
  signatureValid,
  headers,
  payload,
}) {
  // Idempotency: if externalEventId repeats, MySQL unique index will throw.
  const [result] = await db.query(
    `INSERT INTO webhook_events
      (provider, external_event_id, event_type, signature_valid, headers, payload, process_status)
     VALUES (?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), 'received')`,
    [
      provider,
      externalEventId,
      eventType,
      signatureValid ? 1 : 0,
      JSON.stringify(headers || {}),
      JSON.stringify(payload),
    ]
  );
  return result.insertId;
}

async function applyRazorpayCapturedPayment({
  gatewayOrderId,
  gatewayPaymentId,
  amountInPaise,
  payload,
}) {
  const amount = Number(amountInPaise) / 100;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [payments] = await connection.query(
      `SELECT * FROM payments
       WHERE gateway_provider='razorpay' AND gateway_order_id=?
       LIMIT 1 FOR UPDATE`,
      [gatewayOrderId]
    );
    if (!payments.length) {
      throw new Error("Payment order not found for gateway_order_id");
    }
    const payment = payments[0];

    // If already marked paid, be idempotent.
    if (payment.gateway_payment_id && payment.status === "paid") {
      await connection.commit();
      return { paymentId: payment.id, alreadyProcessed: true };
    }

    await connection.query(
      `UPDATE payments
       SET paid_amount=?, status='paid', gateway_payment_id=?, gateway_status='captured', paid_at=NOW(), metadata=CAST(? AS JSON)
       WHERE id=?`,
      [amount, gatewayPaymentId, JSON.stringify(payload || {}), payment.id]
    );

    const txnIdempotency = `razorpay_${gatewayPaymentId}`;
    await connection.query(
      `INSERT INTO payment_transactions
        (payment_id, provider, provider_event_type, provider_order_id, provider_payment_id, idempotency_key, amount, currency, status, raw_payload)
       VALUES (?, 'razorpay', 'payment.captured', ?, ?, ?, ?, 'INR', 'captured', CAST(? AS JSON))`,
      [
        payment.id,
        gatewayOrderId,
        gatewayPaymentId,
        txnIdempotency,
        amount,
        JSON.stringify(payload || {}),
      ]
    );

    // Notify admins + payer via DB notifications (realtime emit done in route)
    const [admins] = await connection.query(
      "SELECT id FROM users WHERE role='admin'"
    );
    for (const a of admins) {
      await connection.query(
        "INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?,?,?,?,0)",
        [
          a.id,
          "Payment received",
          `A payment of ₹${amount} was captured. Order: ${gatewayOrderId}`,
          "payment",
        ]
      );
    }
    await connection.query(
      "INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?,?,?,?,0)",
      [
        payment.user_id,
        "Payment successful",
        `Your payment of ₹${amount} was successful. Ref: ${gatewayPaymentId}`,
        "payment",
      ]
    );

    await connection.commit();
    return { paymentId: payment.id, amount };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  createGatewayBackedOrder,
  recordWebhookEvent,
  applyRazorpayCapturedPayment,
};

