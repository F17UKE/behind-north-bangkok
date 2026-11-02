const express = require('express');
const router = express.Router();

// นำเข้า Controllers
const customerAuth = require('../controllers/customerAuth');
const merchantAuth = require('../controllers/merchantAuth');
const riderAuth = require('../controllers/riderAuth');
const adminAuth = require('../controllers/adminAuth');

// นำเข้า Validation Middleware & Schemas
const validate = require('../middlewares/validate');
const {
    customerRegisterSchema,
    customerLoginSchema,
    merchantRegisterSchema,
    merchantLoginSchema,
    googleLoginSchema,
    lineLoginSchema,
    merchantOnboardSchema,
    riderLoginSchema,
    adminLoginSchema
} = require('../validations/authValidation');

// --- เส้นทางสำหรับลูกค้า (Customer) ---
router.post('/customer/register', validate(customerRegisterSchema), customerAuth.register);
router.post('/customer/login', validate(customerLoginSchema), customerAuth.login);
router.post('/customer/google', validate(googleLoginSchema), customerAuth.googleLogin);
router.post('/customer/line', validate(lineLoginSchema), customerAuth.lineLogin);

// --- เส้นทางสำหรับร้านค้า (Merchant) ---
router.post('/merchant/register', validate(merchantRegisterSchema), merchantAuth.register);
router.post('/merchant/login', validate(merchantLoginSchema), merchantAuth.login);
router.post('/merchant/google', validate(googleLoginSchema), merchantAuth.googleLogin);
router.post('/merchant/google/onboard', validate(merchantOnboardSchema), merchantAuth.googleOnboard);
router.post('/merchant/line', validate(lineLoginSchema), merchantAuth.lineLogin);
router.post('/merchant/line/onboard', validate(merchantOnboardSchema), merchantAuth.lineOnboard);

// --- เส้นทางสำหรับพนักงานส่งอาหาร (Rider) ---
router.post('/rider/login', validate(riderLoginSchema), riderAuth.login);

// --- เส้นทางสำหรับผู้ดูแลระบบ (Admin) ---
router.post('/admin/login', validate(adminLoginSchema), adminAuth.login);

module.exports = router;
