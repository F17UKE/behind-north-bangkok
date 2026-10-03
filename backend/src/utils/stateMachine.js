// backend/src/utils/stateMachine.js

const ORDER_STATES = {
    PENDING_ACCEPT: 'PENDING_ACCEPT',
    REJECTED_BY_MERCHANT: 'REJECTED_BY_MERCHANT',
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    CANCELLED_BY_CUSTOMER: 'CANCELLED_BY_CUSTOMER',
    PAID: 'PAID',
    PREPARING: 'PREPARING',
    READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
    IN_DELIVERY: 'IN_DELIVERY',
    COMPLETED: 'COMPLETED'
};

// กำหนดกฎว่าจากสถานะปัจจุบัน (Key) สามารถเปลี่ยนเป็นสถานะใดได้บ้าง (Value)
const ALLOWED_TRANSITIONS = {
    [ORDER_STATES.PENDING_ACCEPT]: [ORDER_STATES.PENDING_PAYMENT, ORDER_STATES.REJECTED_BY_MERCHANT],
    [ORDER_STATES.PENDING_PAYMENT]: [ORDER_STATES.PAID, ORDER_STATES.CANCELLED_BY_CUSTOMER],
    [ORDER_STATES.PAID]: [ORDER_STATES.PREPARING],
    [ORDER_STATES.PREPARING]: [ORDER_STATES.READY_FOR_DELIVERY], // หรือเปลี่ยนทีละจานผ่าน KDS
    [ORDER_STATES.READY_FOR_DELIVERY]: [ORDER_STATES.IN_DELIVERY],
    [ORDER_STATES.IN_DELIVERY]: [ORDER_STATES.COMPLETED],
    [ORDER_STATES.REJECTED_BY_MERCHANT]: [], // สถานะสิ้นสุด
    [ORDER_STATES.CANCELLED_BY_CUSTOMER]: [], // สถานะสิ้นสุด
    [ORDER_STATES.COMPLETED]: [] // สถานะสิ้นสุด
};

/**
 * ตรวจสอบว่าสามารถเปลี่ยนสถานะได้หรือไม่
 * @param {string} currentState สถานะปัจจุบัน
 * @param {string} nextState สถานะที่ต้องการเปลี่ยน
 * @returns {boolean}
 */
const canTransition = (currentState, nextState) => {
    const allowedNextStates = ALLOWED_TRANSITIONS[currentState];
    return allowedNextStates ? allowedNextStates.includes(nextState) : false;
};

module.exports = {
    ORDER_STATES,
    canTransition
};