const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../middleware/auth");

// ==========================================
// 🚀 1. POST: Send Meal Update
// ==========================================
router.post("/send-meal-update", authMiddleware, adminOnly, async (req, res) => {
  const { meal_type, menu } = req.body;

  try {
    const [students] = await db.query('SELECT id FROM users WHERE role = "student"');
    if (students.length === 0) return res.status(404).json({ message: "No students found" });

    const title = `${meal_type.toUpperCase()} Menu Updated`;
    const message = `Today's ${meal_type}: ${menu}`;
    
    // We set type to 'meal' so the frontend shows the Utensils icon
    const values = students.map((s) => [s.id, title, message, "meal", 0]);

    const sql = "INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ?";
    await db.query(sql, [values]);

    res.status(201).json({ success: true, message: "Meal notifications sent!" });
  } catch (err) {
    res.status(500).json({ message: "Database Error", error: err.message });
  }
});

// ==========================================
// 💰 2. POST: Send Payment/General Broadcast
// ==========================================
// Use this for Payment alerts, System maintenance, or general news
router.post("/broadcast", authMiddleware, adminOnly, async (req, res) => {
  const { title, message, type } = req.body; // type: 'payment', 'system', or 'info'

  try {
    const [students] = await db.query('SELECT id FROM users WHERE role = "student"');
    
    const values = students.map((s) => [
      s.id, 
      title, 
      message, 
      type || "info", 
      0
    ]);

    const sql = "INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ?";
    await db.query(sql, [values]);

    res.status(201).json({ success: true, message: "Broadcast sent!" });
  } catch (err) {
    res.status(500).json({ message: "Database Error", error: err.message });
  }
});

// ==========================================
// 📩 3. GET: Fetch User Notifications
// ==========================================
router.get("/my", authMiddleware, async (req, res) => {
  try {
    // We select 'date' formatted properly for your React screen
    const [rows] = await db.query(
      `SELECT id, title, message, type, is_read, 
       DATE_FORMAT(created_at, '%d %b, %h:%i %p') as date 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==========================================
// ✅ 4. PUT: Mark all as read
// ==========================================
router.put("/mark-read", authMiddleware, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [
      req.user.id,
    ]);
    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==========================================
// 🔔 5. GET: Unread count
// ==========================================
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );
    res.json({ count: rows[0].cnt });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;