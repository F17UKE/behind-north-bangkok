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
    deliveryType: z.enum(['DELIVERY', 'PICKUP']).optional(),
    delivery_type: z.enum(['DELIVERY', 'PICKUP']).optional(),
    dormitoryId: z.number().int().positive().optional().nullable(),
    dormitory_id: z.number().int().positive().optional().nullable(),
    roomNumber: z.string().optional().nullable(),
    room_number: z.string().optional().nullable(),
    items: z.array(orderItemSchema).min(1, 'Order must contain at least 1 item')
}).refine(data => data.merchantId || data.merchant_id, {
    message: 'merchant_id is required'
}).refine(data => {
    const isPickup = (data.deliveryType || data.delivery_type) === 'PICKUP' || String(data.roomNumber || data.room_number).includes('รับเอง');
    if (isPickup) return true;
    return !!(data.dormitoryId || data.dormitory_id);
}, {
    message: 'dormitory_id is required for delivery'
}).transform(data => {
    const isPickup = (data.deliveryType || data.delivery_type) === 'PICKUP' || String(data.roomNumber || data.room_number).includes('รับเอง');
    return {
        ...data,
        merchantId: data.merchantId || data.merchant_id,
        deliveryType: isPickup ? 'PICKUP' : 'DELIVERY',
        delivery_type: isPickup ? 'PICKUP' : 'DELIVERY',
        dormitoryId: isPickup ? null : (data.dormitoryId || data.dormitory_id || null),
        dormitory_id: isPickup ? null : (data.dormitoryId || data.dormitory_id || null),
        roomNumber: isPickup ? '🛍️ รับเองที่หน้าร้าน (Self Pick-up)' : (data.roomNumber || data.room_number || ''),
        room_number: isPickup ? '🛍️ รับเองที่หน้าร้าน (Self Pick-up)' : (data.roomNumber || data.room_number || '')
    };
});

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
