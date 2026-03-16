const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'conference_booking',
  waitForConnections: true,
  connectionLimit: 10,
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL i lidhur me sukses!');
    conn.release();
  } catch (err) {
    console.error('❌ Gabim me MySQL:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };