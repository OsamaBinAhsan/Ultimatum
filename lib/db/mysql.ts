import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getMySQLPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;
    if (connectionString) {
      pool = mysql.createPool(connectionString);
    } else if (process.env.MYSQL_HOST) {
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE || 'kingsdai_ultimatum',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
  }
  return pool;
}

export async function queryMySQL(sql: string, params: any[] = []) {
  const p = getMySQLPool();
  if (!p) return null;
  const [rows] = await p.execute(sql, params);
  return rows;
}
