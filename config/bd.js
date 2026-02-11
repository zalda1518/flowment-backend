import mysql from 'mysql2/promise';

const host = process.env.DB_HOST ?? 'localhost';
const user = process.env.DB_USER ?? 'root';
const password = process.env.DB_PASSWORD ?? '';
const database = process.env.DB_NAME ?? 'flowment';
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // seguridad / timeouts razonables
  connectTimeout: 10000,
});

const connectDB = async () => {
  try {
    console.log(`Conectando MySQL -> `);
    const connection = await pool.getConnection();
    console.log('✅ MySQL conectada correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

export { pool, connectDB };
