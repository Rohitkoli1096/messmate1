const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Note: Ensure these service files exist in your project
const { createOrder, verifyCheckoutSignature } = require("../services/payments/gatewayRazorpay");

// ============================
// ✅ ENSURE UPLOAD DIRECTORY
// ============================
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
// 🚀 NEW: SETTLE BALANCE (Student Action)
// ==========================================
/**
 * Logic: 
 * 1. Inserts a record into the 'transactions' table with the UTR.
 * 2. Updates the 'payments' table status to 'pending'.
 * 3. Notifies Admins of the new submission.
 */
router.post('/settle', authMiddleware, async (req, res) => {
  const { subscription_id, amount, utr_number, title } = req.body;
  const user_id = req.user.id;

  if (!utr_number || utr_number.length < 10) {
    return res.status(400).json({ message: "Valid 12-digit UTR/Reference number required" });
  }

  try {
    // 1. Insert into 'transactions' table (As per your new schema)
    const [transResult] = await db.query(
      `INSERT INTO transactions 
      (user_id, subscription_id, title, total_amount, paid_amount, status, utr_number, method) 
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, 'UPI')`,
      [user_id, subscription_id, title || 'Balance Settlement', amount, amount, utr_number]
    );

    // 2. Update the main 'payments' table status to pending
    await db.query(
      "UPDATE payments SET status = 'pending' WHERE user_id = ? AND subscription_id = ?",
      [user_id, subscription_id]
    );

    // 3. Notify Admin
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    if (admins.length > 0) {
      const adminNotifs = admins.map(admin => [
        admin.id,
        "New Settlement Request 💰",
        `Student ID ${user_id} submitted a payment of ₹${amount}. UTR: ${utr_number}`,
        "payment",
        0
      ]);
      await db.query("INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ?", [adminNotifs]);
    }

    res.json({ 
      success: true, 
      message: 'Settlement submitted for admin verification',
      transactionId: transResult.insertId 
    });

  } catch (err) {
    console.error("Settlement Error:", err);
    res.status(500).json({ message: 'Database Error while processing settlement' });
  }
});

// ============================
// 🚀 GET MY PAYMENT (Student)
// ============================
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

    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Database Error' });
  }
});

// ============================
// ✅ GET ALL PAYMENTS (Admin)
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
// ✅ UPDATE PAYMENT (Admin Manual Verification)
// ============================
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    let { paid_amount } = req.body;
    paid_amount = Number(paid_amount);

    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Payment not found' });

    const total = Number(rows[0].total_amount) || 0;
    let status = 'pending';
    if (paid_amount >= total) status = 'paid';
    else if (paid_amount > 0) status = 'partial';

    // 1. Update Database
    await db.query(
      'UPDATE payments SET paid_amount = ?, status = ?, verified_by = ? WHERE id = ?',
      [paid_amount, status, req.user.id, req.params.id]
    );

    // 2. ✅ Notify Student
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)',
      [
        rows[0].user_id, 
        "Payment Verified ✅", 
        `Your payment of ₹${paid_amount} has been confirmed. Current Status: ${status.toUpperCase()}`, 
        "payment"
      ]
    );

    res.json({ message: 'Payment updated & student notified', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// ✅ UPLOAD SCREENSHOT (Student Action)
// ============================
router.post('/upload-screenshot', authMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const paymentId = Number(req.body.payment_id);
    const screenshotUrl = `uploads/${req.file.filename}`;

    // 1. Update Payment Record
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
// 💳 RAZORPAY: CREATE ORDER
// ============================
router.post('/orders', authMiddleware, async (req, res) => {
    try {
      const { subscription_id } = req.body;
      
      const [payRow] = await db.query(
        "SELECT total_amount, paid_amount FROM payments WHERE subscription_id = ? AND user_id = ?",
        [subscription_id, req.user.id]
      );
  
      if (!payRow.length) return res.status(404).json({ message: "Payment record not found" });
  
      const amountToPay = payRow[0].total_amount - payRow[0].paid_amount;
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