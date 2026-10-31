const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');

// 4. ดึงรายละเอียดเมนูอาหารเดี่ยวพร้อม Modifiers (กลุ่มและตัวเลือกเสริม)
router.get('/:menu_item_id', merchantController.getMenuItemDetail);

module.exports = router;