const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * DATABASE CONNECTION POOL (Aiven SSL Enabled)
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME, // ✅ use correct env key
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  // 🔐 REQUIRED for Aiven
  ssl: {
    rejectUnauthorized: true
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

/**
 * TEST CONNECTION
 */
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to Aiven MySQL (SSL enabled)');
    connection.release();
  } catch (err) {
    console.error('❌ Database Connection Error:', err.message);
    console.error('Code:', err.code);
  }
})();

module.exports = pool;