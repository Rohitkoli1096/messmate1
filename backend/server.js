const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const db = require("./config/db");
const os = require("os");
require("dotenv").config();

const app = express();

// --- 1. DIRECTORY MANAGEMENT ---
// Ensures the uploads folder exists for payment screenshots
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("📁 Created 'uploads' folder");
}

// --- 2. DATABASE CONNECTION ---
db.getConnection()
  .then((conn) => {
    console.log("✅ Database connected successfully");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });

// --- 3. MIDDLEWARE ---
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "*", 
  credentials: true 
}));

// Set limits to 10mb to handle base64 QR codes or high-res payment screenshots
app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files serving
app.use("/uploads", express.static(uploadPath));

// --- 4. ROUTES ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/payments", require("./routes/payments")); // Logic for /settle is here
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/qr", require("./routes/qr"));

// Health Check
app.get("/api/health", (req, res) =>
  res.json({
    status: "MessMate API is healthy 🍛",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
);

app.get("/", (req, res) => {
  res.send("🚀 MessMate Backend is live!");
});

// --- 5. CRON JOBS (Expiry & Attendance Reminders) ---

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
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [s.user_id, "Plan Expiry Reminder", msg, "plan"]
      );
    }
    console.log(`[CRON] Expiry notices sent: ${subs.length}`);
  } catch (err) {
    console.error("[CRON] Expiry Error:", err.message);
  }
});

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
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [s.id, "Don't forget dinner! 🌙", "Dinner is served from 7 PM. Scan your QR to mark attendance!", "attendance"]
      );
    }
    console.log(`[CRON] Dinner reminders sent: ${students.length}`);
  } catch (err) {
    console.error("[CRON] Dinner reminder error:", err.message);
  }
});

// --- 6. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : {}
  });
});

// --- 7. STARTUP & NETWORK INFO ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name of Object.keys(interfaces)) {
    for (let net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const PORT = process.env.PORT || 5001;
const localIP = getLocalIP();

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("\n-----------------------------------------");
  console.log("🍛 MESSMATE API SERVER STARTED");
  console.log(`Local:            http://localhost:${PORT}`);
  console.log(`On Your Network:  http://${localIP}:${PORT}`);
  console.log("-----------------------------------------\n");
});

// Graceful Shutdown for DB stability
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});