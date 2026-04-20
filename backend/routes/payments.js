const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Added for directory safety
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: pay_timestamp.extension
    cb(null, `pay_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Optional: Only allow images
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images (jpg, jpeg, png) are allowed!'));
  }
});

/**
 * @route   GET /api/payments
 * @desc    Get all payments (Admin only)
 */
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/payments/my
 * @desc    Get current student's latest payment record
 */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, s.plan_type, s.duration, s.start_date, s.end_date 
       FROM payments p 
       JOIN subscriptions s ON s.id = p.subscription_id 
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/payments/upload-screenshot
 * @desc    Student uploads a payment proof
 */
router.post('/upload-screenshot', authMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const { payment_id } = req.body;
    
    /** * IMPORTANT CHANGE:
     * We save ONLY the filename (or "uploads/filename") in the database.
     * Since your server.js uses app.use("/uploads", static), we save it as 
     * 'uploads/filename' so it is easy to concatenate.
     */
    const screenshotUrl = `uploads/${req.file.filename}`;

    await db.query(
      'UPDATE payments SET screenshot_url = ? WHERE id = ? AND user_id = ?', 
      [screenshotUrl, payment_id, req.user.id]
    );

    // Notify all admins about the new payment upload
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [
          admin.id, 
          'New Payment Proof', 
          `A student has uploaded a screenshot for verification.`, 
          'payment'
        ]
      );
    }

    res.json({ message: 'Screenshot uploaded successfully!', url: screenshotUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/payments/:id
 * @desc    Admin verifies and updates paid amount
 */
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { paid_amount } = req.body;
    
    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Payment not found' });

    const total = rows[0].total_amount;
    const status = paid_amount >= total ? 'paid' : (paid_amount > 0 ? 'partial' : 'pending');

    await db.query(
      'UPDATE payments SET paid_amount = ?, status = ?, verified_by = ? WHERE id = ?',
      [paid_amount, status, req.user.id, req.params.id]
    );

    // Notify student about the status update
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [
        rows[0].user_id, 
        'Payment Verified', 
        `Your payment of ₹${paid_amount} was verified. Status: ${status.toUpperCase()}`, 
        'payment'
      ]
    );

    res.json({ message: 'Payment verified and updated', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;