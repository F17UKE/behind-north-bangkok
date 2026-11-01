// backend/src/middlewares/validate.js
const { z } = require('zod');

/**
 * Middleware Factory สำหรับตรวจสอบความถูกต้องของ Request ด้วย Zod Schema
 * รองรับการตรวจสอบทั้ง body, query, และ params
 * @param {import('zod').ZodSchema | { body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schema 
 */
const validate = (schema) => (req, res, next) => {
    try {
        // หากส่ง Zod Schema มาโดยตรง ให้ตรวจ body
        if (schema instanceof z.ZodType) {
            req.body = schema.parse(req.body);
            return next();
        }

        // หากส่งเป็น Object แยกส่วน { body, query, params }
        if (schema.body && schema.body instanceof z.ZodType) {
            req.body = schema.body.parse(req.body);
        }

        if (schema.query && schema.query instanceof z.ZodType) {
            req.query = schema.query.parse(req.query);
        }

        if (schema.params && schema.params instanceof z.ZodType) {
            req.params = schema.params.parse(req.params);
        }

        next();
    } catch (error) {
        // ส่งต่อให้ Centralized Error Handling Middleware
        next(error);
    }
};

module.exports = validate;
