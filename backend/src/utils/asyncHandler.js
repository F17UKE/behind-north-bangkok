// backend/src/utils/asyncHandler.js

/**
 * Wrapper สำหรับหุ้ม Async Route Handler เพื่อส่ง Error ไปยัง Centralized Error Middleware อัตโนมัติ
 * ทำให้ไม่ต้องเขียน try-catch ซ้ำๆ ในทุก Controller
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
