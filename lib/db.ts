import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (pool && !(pool as any)._closed) return pool

  const password = process.env.DB_PASSWORD
  if (!password) {
    throw new Error('DB_PASSWORD environment variable is required')
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password,
    database: process.env.DB_NAME || 'monitor',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  })
  return pool
}
