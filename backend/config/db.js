const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Professional Database Configuration
 * Uses Connection Pooling to handle multiple simultaneous student requests.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Connection Pool Settings (Industry Standard)
  waitForConnections: true,
  connectionLimit: 15,      // Adjust based on your Railway tier
  queueLimit: 0,            // No limit on waiting requests
  
  // Stability & Persistence (Crucial for Remote DBs)
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000,    // 20 seconds to allow for network latency
});

/**
 * Initial Connectivity Check
 * This runs once when the server starts to verify the Railway link.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("-----------------------------------------");
    console.log("✅ CLOUD DATABASE CONNECTED");
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`🗄️  DB:   ${process.env.DB_NAME}`);
    console.log("-----------------------------------------");
    connection.release();
  } catch (err) {
    console.error("❌ DATABASE CONNECTION FAILED");
    console.error(`Error Code: ${err.code}`);
    console.error(`Message:    ${err.message}`);
    
    // Quick troubleshooting guide
    if (err.code === 'ETIMEDOUT') {
      console.error("👉 Check if your internet is stable or Railway is down.");
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("👉 Check your DB_USERNAME and DB_PASSWORD in .env");
    }
    
    // Do not kill the process in production immediately, 
    // let the server retry or handle the error gracefully.
  }
};

testConnection();

module.exports = pool;