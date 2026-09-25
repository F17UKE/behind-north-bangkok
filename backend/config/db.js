const knex = require('knex');
const knexConfig = require('../knexfile');

// สร้าง Instance ของ Knex โดยใช้ค่าจาก environment development
const db = knex(knexConfig.development);

module.exports = db;