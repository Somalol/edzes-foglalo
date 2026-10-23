import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isCloudDb = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edzes_foglalo',
  waitForConnections: true,
  connectionLimit: 5,
  ...(isCloudDb ? { ssl: { rejectUnauthorized: false } } : {}),
});