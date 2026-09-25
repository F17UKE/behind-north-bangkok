const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');

router.post('/register', merchantController.registerMerchant);
router.post('/login', merchantController.loginMerchant);
router.post('/social-login', merchantController.socialLoginMerchant);

module.exports = router;