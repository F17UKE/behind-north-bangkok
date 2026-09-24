require('dotenv').config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD, // แนะนำให้ดึงจาก .env
      database: process.env.DB_NAME || 'behind_north_bangkok'
    },
    migrations: {
      directory: './migrations'
    }
  }
};