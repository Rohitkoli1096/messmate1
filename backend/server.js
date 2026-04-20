const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs"); // Added to check folder existence
const cron = require("node-cron");
const db = require("./config/db");
require("dotenv").config();

const app = express();

// 1. ENSURE UPLOADS DIRECTORY EXISTS
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
  console.log("📁 Created 'uploads' folder");
}

// 2. DATABASE CONNECTION
db.getConnection()
  .then((conn) => {
    console.log("✅ Database connected successfully");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });

// 3. MIDDLEWARE
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** * CRITICAL FIX FOR IMAGES:
 * This serves the 'uploads' folder at the /uploads route.
 * Example: http://localhost:5001/uploads/receipt.jpg
 */
app.use("/uploads", express.static(uploadPath));

// 4. ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/notifications", require("./routes/notifications"));

// Health Check
app.get("/api/health", (req, res) =>
  res.json({ status: "MessMate API is running 🍛", static_path: uploadPath })
);

// Root Route
app.get("/", (req, res) => {
  res.send("🚀 MessMate Backend Running Successfully!");
});

// 5. CRON JOBS
// Daily at 8 AM — Plan Expiry notifications
cron.schedule("0 8 * * *", async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [subs] = await db.query(
      `SELECT s.user_id, s.end_date, DATEDIFF(s.end_date, ?) as days_left
       FROM subscriptions s
       WHERE s.is_active=1 AND DATEDIFF(s.end_date, ?) IN (15, 7, 1)`,
      [today, today]
    );

    for (const s of subs) {
      const msg = s.days_left === 1
        ? "Your meal plan expires TOMORROW! Renew now to avoid disruption."
        : `Your meal plan expires in ${s.days_left} days. Please renew soon.`;
      
      await db.query(
        "INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)",
        [s.user_id, `Plan Expiry Reminder`, msg, "plan"]
      );
    }
    console.log(`[CRON] Sent ${subs.length} expiry notifications`);
  } catch (err) {
    console.error("[CRON] Expiry Error:", err.message);
  }
});

// Daily at 6 PM — Dinner reminder
cron.schedule("0 18 * * *", async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [students] = await db.query(
      `SELECT u.id FROM users u
       JOIN subscriptions s ON s.user_id=u.id AND s.is_active=1 AND s.end_date>=? AND s.plan_type='full'
       WHERE u.role='student'
       AND u.id NOT IN (SELECT user_id FROM attendance WHERE date=? AND meal_type='dinner')`,
      [today, today]
    );

    for (const s of students) {
      await db.query(
        "INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)",
        [s.id, "Don't forget dinner! 🌙", "Dinner is served from 7 PM. Scan your QR to mark attendance!", "attendance"]
      );
    }
    console.log(`[CRON] Sent ${students.length} dinner reminders`);
  } catch (err) {
    console.error("[CRON] Dinner reminder error:", err.message);
  }
});

// 6. START SERVER
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🍛 MessMate API running on http://localhost:${PORT}`);
  console.log(`🖼️  Static images served from: ${uploadPath}\n`);
});

module.exports = app; // Exporting for testing purposes