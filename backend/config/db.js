const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * DATABASE CONNECTION POOL
 * Using a pool is better for performance as it reuses connections 
 * rather than opening/closing a new one for every single request.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,      // Adjust based on your traffic
  queueLimit: 0,
  enableKeepAlive: true,    // Prevents "Connection lost" errors during inactivity
  keepAliveInitialDelay: 10000
});

/**
 * TEST CONNECTION
 * This self-executing check ensures your credentials are correct
 * as soon as you run `npm run dev`.
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
      console.error('   Hint: Check your DB_USER and DB_PASSWORD in .env.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   Hint: Is your MySQL server running?');
    }
  }
})();

module.exports = pool;