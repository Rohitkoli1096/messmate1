const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,


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
      console.log('✅ Connected to LOCAL MySQL');
      connection.release();
    } catch (err) {
      console.error('❌ Database Connection Error:', err.message);
      console.error('Code:', err.code);

      if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('👉 Check DB_USERNAME / DB_PASSWORD');
      } else if (err.code === 'ECONNREFUSED') {
        console.error('👉 MySQL server not running or wrong port');
      } else if (err.code === 'ER_BAD_DB_ERROR') {
        console.error('👉 Database does not exist');
      }
    }
})();

module.exports = pool;