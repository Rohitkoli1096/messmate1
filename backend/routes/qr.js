const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const { getIO } = require("../realtime/io");

// --- UTILS & CONSTANTS ---
const QR_SCOPES = { PAYMENT: 'payment', ATTENDANCE: 'attendance' };

const generateSecureToken = (prefix) => {
  const secret = crypto.randomBytes(24).toString("hex");
  return `${prefix}_${secret}_${Date.now()}`;
};

const getMealType = () => (new Date().getHours() < 16 ? 'lunch' : 'dinner');

// ==========================================
// SECURE QR GENERATION (ATOMIC)
// ==========================================

const rotateQR = async (req, scope, valueGenerator) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Deactivate old codes
    await connection.query(
      "UPDATE qr_codes SET is_active=0, revoked_at=NOW(), revoked_reason='rotated' WHERE scope=? AND is_active=1",
      [scope]
    );

    // 2. Get next version
    const [latest] = await connection.query(
      "SELECT IFNULL(MAX(version), 0) + 1 as nextVer FROM qr_codes WHERE scope=?",
      [scope]
    );
    const version = latest[0].nextVer;
    const code_value = valueGenerator();

    // 3. Insert new record
    const [result] = await connection.query(
      "INSERT INTO qr_codes (scope, code_value, version, is_active, created_by) VALUES (?, ?, ?, 1, ?)",
      [scope, code_value, version, req.user.id]
    );

    await connection.commit();
    return { id: result.insertId, scope, version, code_value };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ==========================================
// ROUTES
// ==========================================

router.get("/active", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, scope, version, code_value, created_at as issued_at FROM qr_codes WHERE scope=? AND is_active=1 LIMIT 1",
      [QR_SCOPES.PAYMENT]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ status: "DATABASE_ERROR", message: err.message });
  }
});

router.post("/rotate", authMiddleware, adminOnly, async (req, res) => {
  try {
    const upiId = "7020572471@ibl";
    const data = await rotateQR(req, QR_SCOPES.PAYMENT, () => 
      `upi://pay?pa=${upiId}&pn=MessMate&cu=INR&tr=${crypto.randomBytes(8).toString("hex")}`
    );
    
    const io = getIO();
    if (io) io.to("role:admin").emit("qr:rotated", data);
    
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ status: "ROTATION_FAILURE", message: err.message });
  }
});

router.post("/rotate-attendance", authMiddleware, adminOnly, async (req, res) => {
  try {
    // Industry Logic: Prevent accidental double-rotation within 1 hour
    const [last] = await db.query(
      "SELECT created_at FROM qr_codes WHERE scope=? ORDER BY created_at DESC LIMIT 1",
      [QR_SCOPES.ATTENDANCE]
    );
    
    if (last.length > 0 && (new Date() - new Date(last[0].created_at)) < 3600000) {
      return res.status(429).json({ message: "Cooldown active. Try again in 60 minutes." });
    }

    const data = await rotateQR(req, QR_SCOPES.ATTENDANCE, () => generateSecureToken("ATT"));
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ status: "ROTATION_FAILURE", message: err.message });
  }
});

/**
 * PRODUCTION ATTENDANCE LOGIC
 * Features: Subscription verification, Anti-duplicate checks, Transactional Safety
 */
router.post("/mark-attendance", authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { code_value } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const mealType = getMealType();

    if (!code_value) return res.status(400).json({ message: "Payload missing code_value" });

    await connection.beginTransaction();

    // 1. Verify QR Integrity (Pessimistic Lock)
    const [qr] = await connection.query(
      "SELECT id FROM qr_codes WHERE code_value = ? AND scope = ? AND is_active = 1 FOR UPDATE",
      [code_value.trim(), QR_SCOPES.ATTENDANCE]
    );
    if (!qr.length) throw new Error("SECURE_TOKEN_INVALID_OR_EXPIRED");

    // 2. Verify Subscription Status
    const [sub] = await connection.query(
      "SELECT id FROM subscriptions WHERE user_id = ? AND is_active = 1 AND end_date >= ?",
      [req.user.id, today]
    );
    if (!sub.length) {
      await connection.rollback();
      return res.status(403).json({ status: "SUSPENDED", message: "No active meal plan found." });
    }

    // 3. Atomic Insertion
    await connection.query(
      "INSERT INTO attendance (user_id, date, meal_type, status, qr_id) VALUES (?, ?, ?, 'present', ?)",
      [req.user.id, today, mealType, qr[0].id]
    );

    await connection.commit();

    // 4. Real-time Feedback
    const io = getIO();
    if (io) io.to(`user:${req.user.id}`).emit("attendance:verified", { meal: mealType });

    res.json({ success: true, message: `Access Granted: ${mealType.toUpperCase()}` });

  } catch (err) {
    await connection.rollback();
    const isDup = err.code === 'ER_DUP_ENTRY';
    res.status(isDup ? 409 : 500).json({
      status: isDup ? "ALREADY_MARKED" : "INTERNAL_ERROR",
      message: isDup ? `You have already redeemed your ${getMealType()} today.` : err.message
    });
  } finally {
    connection.release();
  }
});

/**
 * ANALYTICS: Fetch diary logs with optimized SQL
 */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    if(!month || !year) return res.status(400).json({ message: "Month/Year required" });

    const [rows] = await db.query(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, meal_type, status 
       FROM attendance 
       WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
       ORDER BY date ASC`,
      [req.user.id, month, year]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "LOGS_FETCH_FAILURE" });
  }
});

router.get("/attendance-logs", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.id, u.name, u.room, a.date, a.meal_type, a.status, a.scan_time 
      FROM attendance a 
      INNER JOIN users u ON a.user_id = u.id 
      ORDER BY a.scan_time DESC LIMIT 500
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "ADMIN_LOGS_FAILURE" });
  }
});

module.exports = router;