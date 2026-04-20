const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/**
 * @route   GET /api/students
 * @desc    Get all students with their active subscription and payment status
 * @access  Admin Only
 */
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.username, u.phone, u.room, u.created_at,
        s.plan_type, s.duration, s.start_date, s.end_date, s.is_active,
        p.status as payment_status, p.paid_amount, p.total_amount
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id AND s.is_active = 1
      LEFT JOIN payments p ON p.subscription_id = s.id
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/students/:id
 * @desc    Get single student details
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, username, phone, room, created_at FROM users WHERE id = ? AND role = "student"', 
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Admin Only
 */
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, username, password, phone, room } = req.body;
    
    // Default password is 'pass123' if none provided
    const hashed = await bcrypt.hash(password || 'pass123', 10);
    
    const [result] = await db.query(
      'INSERT INTO users (name, username, password, phone, room, role) VALUES (?, ?, ?, ?, ?, "student")',
      [name, username, hashed, phone, room]
    );
    
    res.status(201).json({ message: 'Student created successfully', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/students/:id
 * @desc    Update student profile
 * @access  Admin Only
 */
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, phone, room } = req.body;
    
    const [result] = await db.query(
      'UPDATE users SET name = ?, phone = ?, room = ? WHERE id = ? AND role = "student"', 
      [name, phone, room, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student and all related data (Cascades to payments, subscriptions, attendance)
 * @access  Admin Only
 */
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const studentId = req.params.id;

    // 1. Verify that the target user is a student (Protect Admins from deletion)
    const [user] = await db.query('SELECT role FROM users WHERE id = ?', [studentId]);
    
    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user[0].role !== 'student') {
      return res.status(403).json({ message: 'Action denied: Cannot delete an administrator account' });
    }

    // 2. Perform deletion
    // Due to ON DELETE CASCADE on your updated SQL schema, 
    // linked records in subscriptions, attendance, and payments will be deleted automatically.
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [studentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Delete failed: Student record not found' });
    }

    res.json({ success: true, message: 'Student and all associated records have been removed' });
  } catch (err) {
    console.error("Delete Student Logic Error:", err);
    res.status(500).json({ 
      message: 'Database error: Ensure foreign keys in the payments table are set to CASCADE.', 
      error: err.message 
    });
  }
});

module.exports = router;