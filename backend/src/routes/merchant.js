const express = require('express');
const router = express.Router();

// นำเข้า Controller และ Middleware
const riderAuth = require('../controllers/riderAuth');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

// [POST] /api/merchants/riders
// API สำหรับให้ร้านค้าสร้างบัญชี Rider
router.post('/riders', verifyToken, checkRole(['MERCHANT']), riderAuth.createRider);

module.exports = router;