const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || process.env.MYSQLHOST,
  user:     process.env.DB_USER     || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME     || process.env.MYSQLDATABASE,
  port:     process.env.DB_PORT     || process.env.MYSQLPORT || 3306,
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