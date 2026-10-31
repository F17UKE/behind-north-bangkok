const express = require('express');
const router = express.Router();
const controller = require('../controllers/riderManagementController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

// ป้องกันทุก Route ต้องเป็นร้านค้าที่ล็อกอินแล้วเท่านั้น
router.use(verifyToken);
router.use(checkRole('MERCHANT'));

router.post('/', controller.createRider);
router.get('/', controller.getRiders);
router.patch('/:rider_id/status', controller.updateRiderStatus);

module.exports = router;