const express = require("express");
const router = express.Router();

const { verifyWebhookSignature } = require("../services/payments/gatewayRazorpay");
const {
  recordWebhookEvent,
  applyRazorpayCapturedPayment,
} = require("../services/payments/paymentService");
const { getIO } = require("../realtime/io");

// Razorpay will POST JSON with signature header: x-razorpay-signature
router.post("/razorpay", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody;

  let signatureValid = false;
  try {
    signatureValid = verifyWebhookSignature({
      rawBody,
      signature,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  const payload = req.body;
  const eventType = payload?.event || "unknown";
  const externalEventId =
    req.headers["x-razorpay-event-id"] ||
    req.headers["x-razorpay-eventid"] ||
    (() => {
      const pId = payload?.payload?.payment?.entity?.id;
      return pId ? `${eventType}:${pId}` : null;
    })();

  // Always log webhook event for audit/idempotency (best-effort)
  try {
    await recordWebhookEvent({
      provider: "razorpay",
      externalEventId,
      eventType,
      signatureValid,
      headers: req.headers,
      payload,
    });
  } catch (err) {
    // Duplicate event id => already processed/received
    if (String(err?.code) === "ER_DUP_ENTRY") {
      return res.status(200).json({ ok: true, duplicate: true });
    }
    // still continue; webhook should not flap on audit write errors
  }

  if (!signatureValid) {
    return res.status(400).json({ ok: false, message: "Invalid signature" });
  }

  // Process only captured payments for now
  if (eventType !== "payment.captured") {
    return res.status(200).json({ ok: true, ignored: true });
  }

  try {
    const paymentEntity = payload?.payload?.payment?.entity;
    const gatewayOrderId = paymentEntity?.order_id;
    const gatewayPaymentId = paymentEntity?.id;
    const amountInPaise = paymentEntity?.amount;

    const result = await applyRazorpayCapturedPayment({
      gatewayOrderId,
      gatewayPaymentId,
      amountInPaise,
      payload,
    });

    const io = getIO();
    io.to("role:admin").emit("payment:updated", {
      paymentId: result.paymentId,
      gatewayOrderId,
      gatewayPaymentId,
      amount: result.amount,
    });
    io.to(`user:${payload?.payload?.payment?.entity?.notes?.user_id}`).emit(
      "payment:updated",
      {
        paymentId: result.paymentId,
        gatewayOrderId,
        gatewayPaymentId,
        amount: result.amount,
      },
    );

    io.to("role:admin").emit("notification:new", { type: "payment" });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;

