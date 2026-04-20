const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * DATABASE CONNECTION POOL
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',

  // 🔥 FIX 1: DB_USER → DB_USERNAME
  user: process.env.DB_USERNAME,

  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  // 🔥 FIX 2: REQUIRED SSL for Aiven
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
    console.log('🗄️  MySQL Pool initialized: Connection successful.');
    connection.release();
  } catch (err) {
    console.error('❌ Database Connection Error:');
    console.error(`   Message: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('   Hint: The database name in your .env does not exist.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Hint: Check your DB_USERNAME and DB_PASSWORD in .env.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   Hint: Check DB_HOST or DB_PORT.');
    } else if (err.code === 'UNAVAILABLE') {
      console.error('   Hint: Aiven requires SSL (now added).');
    }
  }
})();

module.exports = pool;