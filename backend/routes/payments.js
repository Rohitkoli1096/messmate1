const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Note: Ensure these service files exist in your project
const { createOrder, verifyCheckoutSignature } = require("../services/payments/gatewayRazorpay");

const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================
// ✅ MULTER CONFIG
// ============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `pay_${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const ok = filetypes.test(path.extname(file.originalname).toLowerCase()) &&
               filetypes.test(file.mimetype);
    if (ok) return cb(null, true);
    cb(new Error('Only images allowed'));
  }
});

// ==========================================
// 🚀 GET MY PAYMENT (Provides Balance Ledger Tracking Context)
// ==========================================
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, s.plan_type, s.duration, s.start_date, s.end_date
      FROM payments p
      JOIN subscriptions s ON s.id = p.subscription_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (!rows.length) {
      return res.json(null);
    }

    const paymentData = rows[0];
    const total_amount = Number(paymentData.total_amount);
    const paid_amount = Number(paymentData.paid_amount);
    const outstanding_amount = total_amount - paid_amount;

    res.json({
      ...paymentData,
      outstanding_amount: outstanding_amount > 0 ? outstanding_amount : 0,
      global_status: paymentData.status
    });

  } catch (err) {
    console.error("Fetch Payment Error:", err);
    res.status(500).json({ message: 'Database Error' });
  }
});

// ==========================================
// 🚀 SECURE: SETTLE BALANCE (Custom Flexible Amount Notification Engine)
// ==========================================
router.post('/settle', authMiddleware, async (req, res) => {
  const { subscription_id, utr_number, custom_amount, title } = req.body;
  const user_id = req.user.id;
  const inputAmount = Number(custom_amount);

  if (!inputAmount || inputAmount <= 0) {
    return res.status(400).json({ message: "A valid positive transfer amount is required." });
  }

  if (!utr_number || utr_number.length < 12) {
    return res.status(400).json({ message: "Valid 12-digit structural UTR signature required." });
  }

  try {
    // 1. Fetch exact plan definitions safely (Never trust amounts coming purely from front-end requests)
    const [payRow] = await db.query(
      "SELECT id, total_amount, paid_amount FROM payments WHERE subscription_id = ? AND user_id = ?",
      [subscription_id, user_id]
    );

    if (!payRow.length) {
      return res.status(404).json({ message: "No payment ledger found for this subscription Context." });
    }

    const { total_amount, paid_amount } = payRow[0];
    const outstandingAmount = Number(total_amount) - Number(paid_amount);

    if (outstandingAmount <= 0) {
      return res.status(400).json({ message: "This subscription balance is already fully settled." });
    }

    // Protection layout check if payload exceeds remaining arrears
    if (inputAmount > outstandingAmount) {
      return res.status(400).json({ message: `Transaction rejected. Maximum allowed payment is limited to ₹${outstandingAmount}` });
    }

    // 2. Insert trace record directly tracking the unique inputAmount variables
    const [transResult] = await db.query(
      `INSERT INTO transactions 
      (user_id, subscription_id, title, total_amount, paid_amount, status, utr_number, method) 
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, 'UPI')`,
      [
        user_id, 
        subscription_id, 
        title || `Flexible Partial UPI Settlement`, 
        inputAmount, 
        inputAmount, 
        utr_number
      ]
    );

    // 3. Keep main payment master tracking row flagged 'pending' for manual verification processing
    await db.query(
      "UPDATE payments SET status = 'pending' WHERE user_id = ? AND subscription_id = ?",
      [user_id, subscription_id]
    );

    // 4. Dispatch Admin Notification Matrix
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    if (admins.length > 0) {
      const adminNotifs = admins.map(admin => [
        admin.id,
        "Custom UPI Audit Required 💰",
        `Student ID ${user_id} requested confirmation of manual transfer: ₹${inputAmount}. UTR: ${utr_number}`,
        "payment",
        0
      ]);
      await db.query("INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ?", [adminNotifs]);
    }

    res.json({ 
      success: true, 
      message: `Payment claim of ₹${inputAmount} logged and submitted successfully for admin verification.`,
      transactionId: transResult.insertId 
    });

  } catch (err) {
    console.error("Settlement Error:", err);
    res.status(500).json({ message: 'Database processing friction encountered during settlement.' });
  }
});

// ==========================================
// 🚀 AUTOMATED RAZORPAY VERIFICATION (Clears entire remaining tab instantly if processed)
// ==========================================
router.post('/verify-signature', authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscription_id } = req.body;
  const user_id = req.user.id;

  const isSignatureValid = verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  
  if (!isSignatureValid) {
    return res.status(400).json({ success: false, message: "Payment signature manipulation detected." });
  }

  try {
    const [payRow] = await db.query(
      "SELECT id, total_amount FROM payments WHERE subscription_id = ? AND user_id = ? AND gateway_order_id = ?",
      [subscription_id, user_id, razorpay_order_id]
    );

    if (!payRow.length) {
      return res.status(404).json({ message: "Corresponding order identifier mismatch." });
    }

    const { id: payment_id, total_amount } = payRow[0];

    // Gateways wipe the remaining balance completely 
    await db.query(
      "UPDATE payments SET paid_amount = ?, status = 'paid' WHERE id = ?",
      [total_amount, payment_id]
    );

    await db.query(
      `INSERT INTO transactions 
      (user_id, subscription_id, title, total_amount, paid_amount, status, utr_number, method) 
      VALUES (?, ?, 'Razorpay Gateway Payment', ?, ?, 'SUCCESS', ?, 'CARD/NETBANKING')`,
      [user_id, subscription_id, total_amount, total_amount, razorpay_payment_id]
    );

    await db.query(
      "UPDATE subscriptions SET status = 'active' WHERE id = ?",
      [subscription_id]
    );

    await db.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, "Payment Verified ✅", "Your automated online gateway payment was captured and verified.", "payment", 0)',
      [user_id]
    );

    res.json({ success: true, message: "Payment validated and processed systematically." });

  } catch (err) {
    console.error("Signature verification internal breakdown:", err);
    res.status(500).json({ message: "Internal error processing payment verification." });
  }
});

// ===============================================
// ✅ UPDATE PAYMENT (Admin Manual Verification API Refactored for Custom Incremental Amounts)
// ===============================================
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { transaction_id, action } = req.body; // action parameters: 'APPROVE' or 'REJECT'

    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Payment record not found' });

    const paymentRecord = rows[0];

    if (action === 'APPROVE') {
      // Find the specific, custom amount logged dynamically under this pending transaction record
      const [txRows] = await db.query('SELECT paid_amount FROM transactions WHERE id = ?', [transaction_id]);
      if (!txRows.length) return res.status(404).json({ message: 'Associated transaction tracking token missing.' });

      const incomingPayment = Number(txRows[0].paid_amount);
      const newTotalPaidAmount = Number(paymentRecord.paid_amount) + incomingPayment;

      // Determine overall updated operational status values
      let globalStatus = 'partial';
      if (newTotalPaidAmount >= Number(paymentRecord.total_amount)) {
        globalStatus = 'paid';
      }

      // 1. Core Update: Increment parameters incrementally inside database metrics
      await db.query(
        `UPDATE payments 
         SET paid_amount = ?, status = ?, verified_by = ? 
         WHERE id = ?`,
        [newTotalPaidAmount, globalStatus, req.user.id, req.params.id]
      );

      // 2. Adjust specific individual transaction index token trace to SUCCESS
      await db.query("UPDATE transactions SET status = 'SUCCESS', verified_at = CURRENT_TIMESTAMP WHERE id = ?", [transaction_id]);

      // 3. Auto-activate system subscription matrix if status hits fully 'paid'
      if (globalStatus === 'paid') {
        await db.query("UPDATE subscriptions SET status = 'active' WHERE id = ?", [paymentRecord.subscription_id]);
      }

      // 4. Notify Student profile wrapper
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)',
        [
          paymentRecord.user_id, 
          "Payment Component Verified! ✅", 
          `Your custom payment entry of ₹${incomingPayment} has been confirmed. Ledger state: ${globalStatus.toUpperCase()}`, 
          "payment"
        ]
      );

      return res.json({ message: 'Payment updated & student notified status successfully changed.', status: globalStatus });
    
    } else if (action === 'REJECT') {
      // Flag specific trace row reference directly to failed state
      await db.query("UPDATE transactions SET status = 'FAILED', verified_at = CURRENT_TIMESTAMP WHERE id = ?", [transaction_id]);
      
      // Fallback parent tracking status back down to functional state
      await db.query("UPDATE payments SET status = 'partial' WHERE id = ?", [req.params.id]);
      
      return res.json({ message: 'Payment transaction proof rejected successfully.' });
    }

    return res.status(400).json({ message: "Invalid operational structural arguments passed." });

  } catch (err) {
    console.error("Admin verification routine crashed:", err);
    res.status(500).json({ message: 'Server processing error updates' });
  }
});

// ============================
// ✅ GET ALL PAYMENTS (Admin Screen Dashboard Context)
// ============================
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.name, u.username, s.plan_type, s.duration, s.start_date, s.end_date
      FROM payments p
      JOIN users u ON u.id = p.user_id
      JOIN subscriptions s ON s.id = p.subscription_id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// ✅ UPLOAD SCREENSHOT (Student Action Backup Option)
// ============================
router.post('/upload-screenshot', authMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const paymentId = Number(req.body.payment_id);
    const screenshotUrl = `uploads/${req.file.filename}`;

    await db.query(
      'UPDATE payments SET screenshot_url = ?, status = "pending" WHERE id = ? AND user_id = ?',
      [screenshotUrl, paymentId, req.user.id]
    );

    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    if (admins.length > 0) {
        const adminNotifs = admins.map(admin => [
            admin.id,
            "New Payment Proof 📸",
            `${req.user.name} uploaded a payment screenshot for verification.`,
            "payment",
            0
        ]);
        await db.query("INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ?", [adminNotifs]);
    }

    res.json({ message: 'Screenshot uploaded for verification', url: screenshotUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// 💳 RAZORPAY: CREATE ORDER (Calculates based on total remaining balance outstanding)
// ============================
router.post('/orders', authMiddleware, async (req, res) => {
  try {
    const { subscription_id } = req.body;
    
    const [payRow] = await db.query(
      "SELECT total_amount, paid_amount FROM payments WHERE subscription_id = ? AND user_id = ?",
      [subscription_id, req.user.id]
    );

    if (!payRow.length) return res.status(404).json({ message: "Payment record not found" });

    const amountToPay = Number(payRow[0].total_amount) - Number(payRow[0].paid_amount);
    if (amountToPay <= 0) return res.status(400).json({ message: "Already paid" });
    
    const order = await createOrder(amountToPay, "INR");

    await db.query(
      "UPDATE payments SET gateway_order_id = ? WHERE subscription_id = ?",
      [order.id, subscription_id]
    );

    res.json({
      key_id: process.env.RAZORPAY_KEY_ID,
      order: order,
      subscription_id: subscription_id
    });
  } catch (err) {
    res.status(500).json({ message: "Could not initiate payment" });
  }
});

module.exports = router;
