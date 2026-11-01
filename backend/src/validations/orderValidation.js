// backend/src/validations/orderValidation.js
const { z } = require('zod');
const { ORDER_STATES } = require('../utils/stateMachine');

// รายการอาหารในออเดอร์
const orderItemSchema = z.object({
    menu_item_id: z.number({ required_error: 'menu_item_id is required' }).int().positive(),
    quantity: z.number({ required_error: 'quantity is required' }).int().min(1, 'Quantity must be at least 1'),
    note: z.string().max(255).optional().nullable(),
    choices: z.array(z.number().int().positive()).optional()
});

// การสร้างออเดอร์ใหม่
const createOrderSchema = z.object({
    merchantId: z.number().int().positive().optional(),
    merchant_id: z.number().int().positive().optional(),
    dormitoryId: z.number().int().positive().optional(),
    dormitory_id: z.number().int().positive().optional(),
    roomNumber: z.string().min(1).optional(),
    room_number: z.string().min(1).optional(),
    items: z.array(orderItemSchema).min(1, 'Order must contain at least 1 item')
}).refine(data => data.merchantId || data.merchant_id, {
    message: 'merchant_id is required'
}).refine(data => data.dormitoryId || data.dormitory_id, {
    message: 'dormitory_id is required'
}).refine(data => data.roomNumber || data.room_number, {
    message: 'room_number is required'
}).transform(data => ({
    ...data,
    merchantId: data.merchantId || data.merchant_id,
    dormitoryId: data.dormitoryId || data.dormitory_id,
    roomNumber: data.roomNumber || data.room_number
}));

// การเปลี่ยนสถานะออเดอร์
const changeOrderStatusSchema = z.object({
    status: z.enum(Object.values(ORDER_STATES), {
        errorMap: () => ({ message: `Invalid status. Allowed values: ${Object.values(ORDER_STATES).join(', ')}` })
    }),
    rider_id: z.number().int().positive().optional().nullable()
});

// มอบหมาย Rider
const assignRiderSchema = z.object({
    rider_id: z.number({ required_error: 'rider_id is required' }).int().positive()
});

module.exports = {
    createOrderSchema,
    changeOrderStatusSchema,
    assignRiderSchema
};
