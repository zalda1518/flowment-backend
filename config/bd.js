const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flowment',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL conectada correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

module.exports = {
  pool,
  connectDB
};
