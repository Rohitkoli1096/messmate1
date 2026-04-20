const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Determine meal type based on current time
function getCurrentMeal() {
  const hour = new Date().getHours();
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 19 && hour < 22) return 'dinner';
  return null;
}

// POST /api/attendance/scan — student scans QR
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const meal = getCurrentMeal();

    if (!meal) {
      return res.status(400).json({ message: 'No meal window active. Lunch: 11–2 PM, Dinner: 7–10 PM' });
    }

    // Check active subscription
    const [subs] = await db.query(
      'SELECT * FROM subscriptions WHERE user_id=? AND is_active=1 AND start_date<=? AND end_date>=?',
      [userId, today, today]
    );
    if (!subs.length) {
      return res.status(403).json({ message: 'Subscription expired. Please renew to continue.' });
    }

    const sub = subs[0];
    // Single meal plan — only lunch
    if (sub.plan_type === 'single' && meal === 'dinner') {
      return res.status(403).json({ message: 'Your plan does not include dinner.' });
    }

    // Mark attendance
    await db.query(
      'INSERT INTO attendance (user_id,date,meal_type,status) VALUES (?,?,?,"present") ON DUPLICATE KEY UPDATE status="present", scan_time=NOW()',
      [userId, today, meal]
    );

    const mealLabel = meal === 'lunch' ? 'Lunch 🍛' : 'Dinner 🌙';
    res.json({ message: `Great! ${mealLabel} marked successfully!`, meal, date: today });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/my — student's own diary
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;
    let query = 'SELECT * FROM attendance WHERE user_id=?';
    const params = [userId];
    if (month && year) {
      query += ' AND MONTH(date)=? AND YEAR(date)=?';
      params.push(month, year);
    }
    query += ' ORDER BY date DESC, meal_type';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/daily — admin: today's attendance
router.get('/daily', authMiddleware, adminOnly, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.username,
        MAX(CASE WHEN a.meal_type='lunch' THEN a.status END) AS lunch,
        MAX(CASE WHEN a.meal_type='dinner' THEN a.status END) AS dinner,
        MAX(a.scan_time) AS last_scan
      FROM users u
      LEFT JOIN attendance a ON a.user_id=u.id AND a.date=?
      WHERE u.role='student'
      GROUP BY u.id, u.name, u.username
    `, [date]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/stats — dashboard stats
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [[lunch]] = await db.query("SELECT COUNT(*) as cnt FROM attendance WHERE date=? AND meal_type='lunch' AND status='present'", [today]);
    const [[dinner]] = await db.query("SELECT COUNT(*) as cnt FROM attendance WHERE date=? AND meal_type='dinner' AND status='present'", [today]);
    const [[total]] = await db.query("SELECT COUNT(*) as cnt FROM users WHERE role='student'");
    res.json({ date: today, lunch: lunch.cnt, dinner: dinner.cnt, total: total.cnt, absent: total.cnt - lunch.cnt });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/weekly — 7-day trend
router.get('/weekly', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT date, meal_type, COUNT(*) as count
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status='present'
      GROUP BY date, meal_type
      ORDER BY date
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/attendance/absence-check — check and extend for 6+ continuous absences
router.post('/absence-check', authMiddleware, adminOnly, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [students] = await db.query("SELECT id FROM users WHERE role='student'");
    const extended = [];

    for (const s of students) {
      const [sub] = await db.query(
        'SELECT * FROM subscriptions WHERE user_id=? AND is_active=1 AND end_date>=?',
        [s.id, today]
      );
      if (!sub.length) continue;

      // Count continuous absence from end of subscription backwards
      const [absences] = await db.query(`
        SELECT COUNT(*) as cnt FROM (
          SELECT date FROM attendance
          WHERE user_id=? AND date BETWEEN ? AND ?
          AND status='absent'
        ) a
      `, [s.id, sub[0].start_date, today]);

      if (absences[0].cnt >= 6) {
        const newEnd = new Date(sub[0].end_date);
        newEnd.setDate(newEnd.getDate() + absences[0].cnt);
        await db.query('UPDATE subscriptions SET end_date=? WHERE id=?', [newEnd.toISOString().split('T')[0], sub[0].id]);
        extended.push({ userId: s.id, daysExtended: absences[0].cnt });
      }
    }
    res.json({ message: 'Absence check complete', extended });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
