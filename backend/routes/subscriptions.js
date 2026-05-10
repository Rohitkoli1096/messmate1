const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const PLAN_PRICES = {
  full_1month: 2200,
  full_15days: 1100,
  single_1month: 1100,
  single_15days: 550
};

function calcEndDate(startDate, duration) {
  const d = new Date(startDate);
  if (duration === '1month') d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 15);
  return d.toISOString().split('T')[0];
}

// ==========================================
// 📩 1. GET: My subscription (Student)
// ==========================================
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, p.paid_amount, p.total_amount, p.status as payment_status 
       FROM subscriptions s 
       LEFT JOIN payments p ON p.subscription_id = s.id 
       WHERE s.user_id = ? AND s.is_active = 1 
       ORDER BY s.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==========================================
// 📋 2. GET: All subscriptions (Admin)
// ==========================================
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.name, u.username, p.paid_amount, p.total_amount, p.status as payment_status
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN payments p ON p.subscription_id = s.id
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==========================================
// 🚀 3. POST: Assign plan (Admin)
// ==========================================
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const connection = await db.getConnection(); // Use transaction for data safety
  try {
    await connection.beginTransaction();

    const { user_id, plan_type, duration, start_date, paid_amount } = req.body;
    const key = `${plan_type}_${duration}`;
    const price = PLAN_PRICES[key];
    
    if (!price) return res.status(400).json({ message: 'Invalid plan configuration' });

    const end_date = calcEndDate(start_date, duration);

    // 1. Deactivate old subscriptions
    await connection.query('UPDATE subscriptions SET is_active = 0 WHERE user_id = ?', [user_id]);

    // 2. Insert new subscription
    const [subResult] = await connection.query(
      'INSERT INTO subscriptions (user_id, plan_type, duration, price, start_date, end_date, is_active) VALUES (?,?,?,?,?,?,1)',
      [user_id, plan_type, duration, price, start_date, end_date]
    );

    const subId = subResult.insertId;
    const paidAmt = parseFloat(paid_amount) || 0;
    const status = paidAmt >= price ? 'paid' : (paidAmt > 0 ? 'partial' : 'pending');

    // 3. Insert payment record
    await connection.query(
      'INSERT INTO payments (user_id, subscription_id, total_amount, paid_amount, status) VALUES (?,?,?,?,?)',
      [user_id, subId, price, paidAmt, status]
    );

    // 4. ✅ Trigger Active Notification for Student
    const notifTitle = "New Plan Activated 🟢";
    const notifMsg = `Your ${plan_type.replace('_', ' ')} plan (${duration}) is active until ${end_date}. Payment Status: ${status.toUpperCase()}.`;
    
    await connection.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?,?,?,?,0)',
      [user_id, notifTitle, notifMsg, 'payment']
    );

    await connection.commit();
    res.status(201).json({ success: true, message: 'Subscription assigned and student notified', subscription_id: subId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Transaction failed', error: err.message });
  } finally {
    connection.release();
  }
});

// ==========================================
// ⏳ 4. PUT: Extend subscription (Admin)
// ==========================================
router.put('/:id/extend', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { days } = req.body;
    const [subs] = await db.query('SELECT * FROM subscriptions WHERE id = ?', [req.params.id]);
    
    if (!subs.length) return res.status(404).json({ message: 'Subscription not found' });

    const oldEnd = new Date(subs[0].end_date);
    const newEnd = new Date(oldEnd);
    newEnd.setDate(newEnd.getDate() + parseInt(days));
    const newEndStr = newEnd.toISOString().split('T')[0];

    await db.query('UPDATE subscriptions SET end_date = ? WHERE id = ?', [newEndStr, req.params.id]);

    // ✅ Notify Student about Extension
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?,?,?,?,0)',
      [
        subs[0].user_id, 
        "Plan Extended ⏳", 
        `Admin has extended your plan by ${days} days. New expiry: ${newEndStr}.`, 
        "info"
      ]
    );

    res.json({ success: true, message: `Extended to ${newEndStr}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;