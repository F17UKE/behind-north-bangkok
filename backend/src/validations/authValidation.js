// backend/src/validations/authValidation.js
const { z } = require('zod');

// 1. ลูกค้า (Customer)
const customerRegisterSchema = z.object({
    username: z.string({ required_error: 'Username is required' })
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must not exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
    email: z.string({ required_error: 'Email is required' })
        .email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' })
        .min(6, 'Password must be at least 6 characters'),
    phone: z.string()
        .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
        .optional()
        .nullable(),
    dormitory_id: z.number().int().positive().optional().nullable(),
    room_number: z.string().max(20).optional().nullable()
});

const customerLoginSchema = z.object({
    username: z.string({ required_error: 'Username or Email is required' }).min(1),
    password: z.string({ required_error: 'Password is required' }).min(1)
});

// 2. ร้านค้า (Merchant)
const merchantRegisterSchema = z.object({
    username: z.string({ required_error: 'Username is required' })
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must not exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
    password: z.string({ required_error: 'Password is required' })
        .min(6, 'Password must be at least 6 characters'),
    store_name: z.string({ required_error: 'Store name is required' })
        .min(2, 'Store name must be at least 2 characters')
        .max(100),
    category: z.string().max(80).optional().nullable(),
    email: z.string().email('Invalid email address').optional().nullable(),
    promptpay_id: z.string()
        .regex(/^[0-9]{10,13}$/, 'PromptPay ID must be a 10-digit phone number or 13-digit National ID')
        .optional()
        .nullable(),
    location: z.string().optional().nullable(),
    store_image_url: z.string().url('Invalid image URL').optional().nullable()
});

const merchantLoginSchema = z.object({
    username: z.string({ required_error: 'Username or Email is required' }).min(1),
    password: z.string({ required_error: 'Password is required' }).min(1)
});

const merchantPasswordChangeSchema = z.object({
    current_password: z.string({ required_error: 'Current password is required' }).min(1),
    new_password: z.string({ required_error: 'New password is required' }).min(8).max(128)
});

// 3. Social Logins
const googleLoginSchema = z.object({
    id_token: z.string({ required_error: 'Google id_token is required' }).min(1)
});

const lineLoginSchema = z.object({
    access_token: z.string().optional(),
    id_token: z.string().optional()
}).refine(data => data.access_token || data.id_token, {
    message: 'Either access_token or id_token is required for LINE login'
});

const merchantOnboardSchema = z.object({
    google_id: z.string().optional(),
    line_id: z.string().optional(),
    email: z.string().email().optional().nullable(),
    store_name: z.string({ required_error: 'Store name is required' }).min(2).max(100),
    promptpay_id: z.string().regex(/^[0-9]{10,13}$/, 'PromptPay ID must be 10 or 13 digits').optional().nullable(),
    location: z.string().optional().nullable(),
    store_image_url: z.string().url().optional().nullable()
});

// 4. Rider & Admin Logins
const riderLoginSchema = z.object({
    username: z.string({ required_error: 'Username is required' }).min(1),
    password: z.string({ required_error: 'Password is required' }).min(1)
});

const adminLoginSchema = z.object({
    username: z.string({ required_error: 'Admin username is required' }).min(1),
    password: z.string({ required_error: 'Admin password is required' }).min(1)
});

module.exports = {
    customerRegisterSchema,
    customerLoginSchema,
    merchantRegisterSchema,
    merchantLoginSchema,
    merchantPasswordChangeSchema,
    googleLoginSchema,
    lineLoginSchema,
    merchantOnboardSchema,
    riderLoginSchema,
    adminLoginSchema
};
