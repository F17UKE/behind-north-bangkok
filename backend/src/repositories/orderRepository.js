// backend/src/repositories/orderRepository.js
const knex = require('../db');

const invalidOrder = (message) => Object.assign(new Error(message), { statusCode: 400 });

const createOrder = async (orderData) => {
    const { customerId, merchantId, dormitoryId, roomNumber, items } = orderData;

    return await knex.transaction(async (trx) => {
        // 1. Snapshot: ค้นหาค่าส่ง
        const dormitory = await trx('DORMITORIES').where('id', dormitoryId).first();
        if (!dormitory) throw invalidOrder('ไม่พบหอพักปลายทาง');
        const merchant = await trx('MERCHANTS')
            .where({ id: merchantId, is_approved: true, is_open: true })
            .forUpdate()
            .first();
        if (!merchant) throw invalidOrder('ร้านค้านี้ปิดให้บริการหรือยังไม่ได้รับอนุมัติ');
        const deliveryFeeRecord = await trx('DELIVERY_FEES')
            .where({ merchant_id: merchantId, soi_id: dormitory.soi_id })
            .first();
        const deliveryFee = deliveryFeeRecord ? parseFloat(deliveryFeeRecord.fee) : 0;

        let totalAmount = deliveryFee;

        // 2. จัดการ Running Number ของร้านค้า (คิวออเดอร์) แบบ Row-Level Locking (forUpdate)
        // เพื่อป้องกัน Race Condition เมื่อมีลูกค้ากดสั่งซื้อพร้อมกันหลายคน
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
            delivery_dormitory_id: dormitoryId,
            delivery_room_number: roomNumber,
            delivery_fee: deliveryFee,
            total_amount: 0,
            status: 'PENDING_ACCEPT',
            customer_last_read_message_id: 0, 
            merchant_last_read_message_id: 0, 
            created_at: knex.fn.now()
        }).returning('*');

        // 4. วนลูปบันทึก Items และทำ Snapshot ราคา
        for (const item of items) {
            const menuItem = await trx('MENU_ITEMS')
                .where({ id: item.menu_item_id, merchant_id: merchantId, is_available: true })
                .first();
            if (!menuItem) throw invalidOrder(`ไม่พบเมนูที่เปิดขายในร้านนี้ (ID ${item.menu_item_id})`);
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
                const validChoices = await trx('MENU_OPTION_CHOICES as choice')
                    .join('MENU_OPTION_GROUPS as mog', 'mog.id', 'choice.option_group_id')
                    .where('mog.menu_item_id', menuItem.id)
                    .whereIn('choice.id', item.choices)
                    .select('choice.id');
                if (validChoices.length !== new Set(item.choices).size) {
                    throw invalidOrder(`ตัวเลือกเสริมของเมนู ${menuItem.name} ไม่ถูกต้อง`);
                }
                for (const choiceId of item.choices) {
                    const choice = await trx('MENU_OPTION_CHOICES').where('id', choiceId).first();
                    const extraPrice = parseFloat(choice.extra_price);
                    itemTotal += (extraPrice * item.quantity);

                    await trx('ORDER_ITEM_CHOICES').insert({
                        order_item_id: orderItem.id,
                        menu_option_choice_id: choiceId,
                        choice_name: choice.name,
                        extra_price: extraPrice
                    });
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

const listOrdersForUser = async (role, userId) => {
    const query = knex('ORDERS as o')
        .leftJoin('MERCHANTS as m', 'm.id', 'o.merchant_id')
        .leftJoin('CUSTOMERS as c', 'c.id', 'o.customer_id')
        .select(
            'o.*',
            'm.store_name',
            'm.store_image_url',
            'c.username as customer_username',
            'c.phone as customer_phone'
        )
        .orderBy('o.created_at', 'desc');

    if (role === 'CUSTOMER') query.where('o.customer_id', userId);
    else if (role === 'MERCHANT') query.where('o.merchant_id', userId);
    else if (role === 'RIDER') query.where('o.rider_id', userId);
    else if (role !== 'ADMIN') return [];

    const orders = await query;
    if (!orders.length) return [];

    const orderIds = orders.map((order) => order.id);
    const items = await knex('ORDER_ITEMS as oi')
        .leftJoin('MENU_ITEMS as mi', 'mi.id', 'oi.menu_item_id')
        .select('oi.*', 'mi.name as menu_name')
        .whereIn('oi.order_id', orderIds)
        .orderBy('oi.id', 'asc');
    const itemIds = items.map((item) => item.id);
    const choices = itemIds.length
        ? await knex('ORDER_ITEM_CHOICES').whereIn('order_item_id', itemIds).orderBy('id', 'asc')
        : [];

    const messages = await knex('MESSAGES')
        .whereIn('order_id', orderIds)
        .select('id', 'order_id', 'is_merchant_sender');
    const unreadCounts = new Map(orderIds.map((orderId) => [orderId, 0]));
    const ordersById = new Map(orders.map((order) => [order.id, order]));
    for (const message of messages) {
        const order = ordersById.get(message.order_id);
        if (!order) continue;
        const readThrough = role === 'CUSTOMER'
            ? Number(order.customer_last_read_message_id || 0)
            : role === 'MERCHANT' || role === 'RIDER'
                ? Number(order.merchant_last_read_message_id || 0)
                : Number.MAX_SAFE_INTEGER;
        const fromOtherSide = role === 'CUSTOMER'
            ? Boolean(message.is_merchant_sender)
            : (role === 'MERCHANT' || role === 'RIDER') && !message.is_merchant_sender;
        if (fromOtherSide && Number(message.id) > readThrough) {
            unreadCounts.set(order.id, (unreadCounts.get(order.id) || 0) + 1);
        }
    }

    return orders.map((order) => ({
        ...order,
        unread_message_count: unreadCounts.get(order.id) || 0,
        items: items.filter((item) => item.order_id === order.id).map((item) => ({
            ...item,
            choices: choices.filter((choice) => choice.order_item_id === item.id),
        })),
    }));
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
    listOrdersForUser,
    updateOrderStatus
};
