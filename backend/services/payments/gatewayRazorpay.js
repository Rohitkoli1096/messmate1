const Razorpay = require("razorpay");
const crypto = require("crypto");

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Missing Razorpay credentials");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function createOrder({ amountInPaise, currency = "INR", receipt, notes }) {
  const razorpay = getRazorpayClient();
  return razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
}

function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

function verifyWebhookSignature({ rawBody, signature }) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  }
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}

module.exports = {
  createOrder,
  verifyCheckoutSignature,
  verifyWebhookSignature,
};

