const express = require('express');
const router = express.Router();
const controller = require('../controllers/merchantManagementController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

// เรียกใช้ Middleware ทุก Route ในไฟล์นี้
router.use(verifyToken);
router.use(checkRole('MERCHANT'));

// 1. Profile & Status
router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);
router.patch('/status', controller.updateStatus);

// 2. Menu Management
router.post('/menus', controller.createMenu);
router.patch('/menus/:menu_id/availability', controller.updateMenuAvailability);
router.put('/menus/:menu_id', controller.updateMenu);
// router.delete('/menus/:menu_id', controller.deleteMenu);

// 3. Option Groups & Choices
router.post('/menus/:menu_id/option-groups', controller.createOptionGroup);
router.post('/menus/option-groups/:group_id/choices', controller.createOptionChoice);

// 4. Delivery Fees Management
router.get('/delivery-fees', controller.getDeliveryFees);
router.put('/delivery-fees', controller.updateDeliveryFee);

module.exports = router;