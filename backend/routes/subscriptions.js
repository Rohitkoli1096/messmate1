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

// GET my subscription (student)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT s.*, p.paid_amount, p.total_amount, p.status as payment_status FROM subscriptions s LEFT JOIN payments p ON p.subscription_id=s.id WHERE s.user_id=? AND s.is_active=1 ORDER BY s.created_at DESC LIMIT 1',
      [req.user.id]
  );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET all subscriptions (admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.name, u.username, p.paid_amount, p.total_amount, p.status as payment_status
      FROM subscriptions s
      JOIN users u ON u.id=s.user_id
      LEFT JOIN payments p ON p.subscription_id=s.id
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST assign plan (admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { user_id, plan_type, duration, start_date, paid_amount } = req.body;
    const key = `${plan_type}_${duration}`;
    const price = PLAN_PRICES[key];
    if (!price) return res.status(400).json({ message: 'Invalid plan' });

    const end_date = calcEndDate(start_date, duration);

    // Deactivate old subscription
    await db.query('UPDATE subscriptions SET is_active=0 WHERE user_id=? AND is_active=1', [user_id]);

    const [result] = await db.query(
      'INSERT INTO subscriptions (user_id,plan_type,duration,price,start_date,end_date) VALUES (?,?,?,?,?,?)',
      [user_id, plan_type, duration, price, start_date, end_date]
    );

    const subId = result.insertId;
    const paidAmt = paid_amount || 0;
    const status = paidAmt >= price ? 'paid' : paidAmt > 0 ? 'partial' : 'pending';

    await db.query(
      'INSERT INTO payments (user_id,subscription_id,total_amount,paid_amount,status) VALUES (?,?,?,?,?)',
      [user_id, subId, price, paidAmt, status]
    );

    // Create notification
    await db.query(
      'INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)',
      [user_id, 'Plan Assigned', `Your ${plan_type} meal plan has been activated from ${start_date} to ${end_date}.`, 'plan']
    );

    res.status(201).json({ message: 'Subscription assigned', subscription_id: subId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT extend subscription (admin)
router.put('/:id/extend', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { days } = req.body;
    const [subs] = await db.query('SELECT * FROM subscriptions WHERE id=?', [req.params.id]);
    if (!subs.length) return res.status(404).json({ message: 'Subscription not found' });

    const newEnd = new Date(subs[0].end_date);
    newEnd.setDate(newEnd.getDate() + parseInt(days));
    const newEndStr = newEnd.toISOString().split('T')[0];

    await db.query('UPDATE subscriptions SET end_date=? WHERE id=?', [newEndStr, req.params.id]);
    res.json({ message: `Extended by ${days} days. New end: ${newEndStr}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
