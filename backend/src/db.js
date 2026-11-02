const knex = require('knex');
const knexConfig = require('../knexfile');

// กำหนด environment ปัจจุบัน (ค่าเริ่มต้นคือ development)
const environment = process.env.NODE_ENV || 'development';

// สร้างการเชื่อมต่อ
const db = knex(knexConfig[environment]);

module.exports = db;