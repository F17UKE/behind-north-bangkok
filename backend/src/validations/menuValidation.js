// backend/src/validations/menuValidation.js
const { z } = require('zod');

// สร้างเมนูอาหารใหม่
const createMenuSchema = z.object({
    name: z.string({ required_error: 'Menu name is required' }).min(1).max(100),
    description: z.string().optional().nullable(),
    price: z.number({ required_error: 'Price is required' }).min(0, 'Price cannot be negative'),
    is_available: z.boolean().optional(),
    image_url: z.string().url('Invalid image URL').optional().nullable()
});

// อัปเดตเมนูอาหาร
const updateMenuSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional().nullable(),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    image_url: z.string().url('Invalid image URL').optional().nullable()
});

// เปิด-ปิดการขายเมนู
const updateMenuAvailabilitySchema = z.object({
    is_available: z.boolean({ required_error: 'is_available is required' })
});

// สร้างกลุ่มตัวเลือกเสริม
const createOptionGroupSchema = z.object({
    name: z.string({ required_error: 'Option group name is required' }).min(1).max(100),
    is_required: z.boolean().optional(),
    allow_multiple: z.boolean().optional()
});

// สร้างตัวเลือกย่อยในกลุ่ม
const createOptionChoiceSchema = z.object({
    name: z.string({ required_error: 'Choice name is required' }).min(1).max(100),
    extra_price: z.number().min(0, 'Extra price cannot be negative').optional()
});

// ตั้งค่าค่าจัดส่งตามซอย
const deliveryFeeSchema = z.object({
    soi_id: z.number({ required_error: 'soi_id is required' }).int().positive(),
    fee: z.number({ required_error: 'fee is required' }).min(0, 'Fee cannot be negative')
});

module.exports = {
    createMenuSchema,
    updateMenuSchema,
    updateMenuAvailabilitySchema,
    createOptionGroupSchema,
    createOptionChoiceSchema,
    deliveryFeeSchema
};
