const express = require('express');
const router = express.Router();
const controller = require('../controllers/merchantManagementController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');
const validate = require('../middlewares/validate');
const {
    createMenuSchema,
    updateMenuSchema,
    updateMenuAvailabilitySchema,
    createOptionGroupSchema,
    createOptionChoiceSchema,
    deliveryFeeSchema
} = require('../validations/menuValidation');

// เรียกใช้ Middleware ทุก Route ในไฟล์นี้
router.use(verifyToken);
router.use(checkRole('MERCHANT'));

// 1. Profile & Status
router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);
router.patch('/status', controller.updateStatus);

// 2. Menu Management
router.get('/menus', controller.getMenus);
router.post('/menus', validate(createMenuSchema), controller.createMenu);
router.patch('/menus/:menu_id/availability', validate(updateMenuAvailabilitySchema), controller.updateMenuAvailability);
router.put('/menus/:menu_id', validate(updateMenuSchema), controller.updateMenu);
router.delete('/menus/:menu_id', controller.deleteMenu);

// 3. Option Groups & Choices
router.post('/menus/:menu_id/option-groups', validate(createOptionGroupSchema), controller.createOptionGroup);
router.delete('/menus/option-groups/:group_id', controller.deleteOptionGroup);
router.post('/menus/option-groups/:group_id/choices', validate(createOptionChoiceSchema), controller.createOptionChoice);
router.delete('/menus/choices/:choice_id', controller.deleteOptionChoice);

// 4. Delivery Fees Management
router.get('/delivery-fees', controller.getDeliveryFees);
router.put('/delivery-fees', validate(deliveryFeeSchema), controller.updateDeliveryFee);

module.exports = router;
