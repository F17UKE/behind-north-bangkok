// backend/src/repositories/orderRepository.js
const knex = require('../db');

const createOrder = async (orderData) => {
    const { customerId, merchantId, dormitoryId, roomNumber, items, deliveryType, delivery_type } = orderData;
    const isPickup = (deliveryType === 'PICKUP' || delivery_type === 'PICKUP' || String(roomNumber).includes('รับเองที่หน้าร้าน'));

    return await knex.transaction(async (trx) => {
        // 1. Snapshot: ค้นหาค่าส่ง (ถ้ารับเองที่หน้าร้าน ค่าส่งเป็น 0 เสมอ)
        let deliveryFee = 0;
        if (!isPickup && dormitoryId) {
            const dormitory = await trx('DORMITORIES').where('id', dormitoryId).first();
            if (dormitory) {
                const deliveryFeeRecord = await trx('DELIVERY_FEES')
                    .where({ merchant_id: merchantId, soi_id: dormitory.soi_id })
                    .first();
                deliveryFee = deliveryFeeRecord ? parseFloat(deliveryFeeRecord.fee) : 0;
            }
        }

        let totalAmount = deliveryFee;

        // 2. จัดการ Running Number ของร้านค้า (คิวออเดอร์) แบบ Row-Level Locking (forUpdate)
        // เพื่อป้องกัน Race Condition เมื่อมีลูกค้ากดสั่งซื้อพร้อมกันหลายคน
        const merchant = await trx('MERCHANTS')
            .where('id', merchantId)
            .forUpdate()
            .first();
        
        if (!merchant) {
            throw new Error(`Merchant with ID ${merchantId} not found in database.`);
        }

        const newOrderNumber = (merchant.last_order_number || 0) + 1;

        // อัปเดตคิวล่าสุดกลับไปที่ตารางร้านค้า
        await trx('MERCHANTS')
            .where('id', merchantId)
            .update({ last_order_number: newOrderNumber });

        // สร้าง order_code รูปแบบ: Prefix-เลขคิว (ใช้ padStart เติม 0 ด้านหน้าให้ดูสวยงาม เช่น PJAM-0001)
        const customOrderCode = merchant.prefix + "-" + String(newOrderNumber).padStart(4, '0');

        // 3. สร้าง Order Header
        const [order] = await trx('ORDERS').insert({
            order_code: customOrderCode,
            merchant_order_number: newOrderNumber,
            customer_id: customerId,
            merchant_id: merchantId,
            delivery_dormitory_id: isPickup ? null : (dormitoryId || null),
            delivery_room_number: isPickup ? '🛍️ รับเองที่หน้าร้าน (Self Pick-up)' : roomNumber,
            delivery_fee: deliveryFee,
            total_amount: 0,
            status: 'PENDING_ACCEPT',
            customer_last_read_message_id: 0, 
            merchant_last_read_message_id: 0, 
            created_at: knex.fn.now()
        }).returning('*');

        // 4. วนลูปบันทึก Items และทำ Snapshot ราคา
        for (const item of items) {
            const menuItem = await trx('MENU_ITEMS').where('id', item.menu_item_id).first();
            const unitPrice = parseFloat(menuItem.price);
            let itemTotal = unitPrice * item.quantity;

            const [orderItem] = await trx('ORDER_ITEMS').insert({
                order_id: order.id,
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                unit_price: unitPrice,
                note: item.note || '',
                is_completed: false
            }).returning('*');

            // บันทึก Choices (ถ้ามี)
            if (item.choices && item.choices.length > 0) {
                for (const choiceId of item.choices) {
                    const choice = await trx('MENU_OPTION_CHOICES').where('id', choiceId).first();
                    if (choice) {
                        const extraPrice = parseFloat(choice.extra_price || 0) || 0;
                        itemTotal += (extraPrice * item.quantity);

                        await trx('ORDER_ITEM_CHOICES').insert({
                            order_item_id: orderItem.id,
                            menu_option_choice_id: choice.id,
                            choice_name: choice.name,
                            extra_price: extraPrice
                        });
                    }
                }
            }
            totalAmount += itemTotal;
        }

        // 5. อัปเดต Total Amount กลับไป
        await trx('ORDERS').where('id', order.id).update({ total_amount: totalAmount });
        order.total_amount = totalAmount;

        return order;
    });
};

const getOrderById = async (orderId) => {
    return await knex('ORDERS').where('id', orderId).first();
};

const updateOrderStatus = async (orderId, newStatus, riderId = null) => {
    const updateData = { status: newStatus };
    
    if (newStatus === 'READY_FOR_DELIVERY' && riderId) {
        updateData.rider_id = riderId;
    }

    const [updatedOrder] = await knex('ORDERS')
        .where('id', orderId)
        .update(updateData)
        .returning('*');
    return updatedOrder;
};

module.exports = {
    createOrder,
    getOrderById,
    updateOrderStatus
};
