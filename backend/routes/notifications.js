const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

// 1. POST: Send meal update to all students
router.post("/send-meal-update", authMiddleware, async (req, res) => {
  const { meal_type, menu } = req.body;

  try {
    // Get all students
    const [students] = await db.query(
      'SELECT id FROM users WHERE role = "student"',
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const title = `${meal_type.toUpperCase()} Menu Updated`;
    const message = `Today's ${meal_type}: ${menu}`;
    const type = "meal";

    // Insert notifications for each student
    for (let student of students) {
      await db.query(
        "INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)",
        [student.id, title, message, type],
      );
    }

    res.status(201).json({ success: true, message: "Notifications sent!" });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({
      message: "Database Error",
      error: 'Ensure "meal" is added to the ENUM in your SQL table.',
    });
  }
});

// 2. GET: My notifications (Current logged in user)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 3. PUT: Mark all as read
router.put("/mark-read", authMiddleware, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read=1 WHERE user_id=?", [
      req.user.id,
    ]);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 4. GET: Unread count
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.query(
      "SELECT COUNT(*) as cnt FROM notifications WHERE user_id=? AND is_read=0",
      [req.user.id],
    );
    res.json({ count: row.cnt || 0 });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
