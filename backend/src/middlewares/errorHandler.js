// backend/src/middlewares/errorHandler.js
const { ZodError } = require('zod');
const { AppError, NotFoundError } = require('../utils/errors');

/**
 * Middleware สำหรับจัดการ 404 เมื่อเรียก Route ที่ไม่มีในระบบ
 */
const notFoundHandler = (req, res, next) => {
    next(new NotFoundError(`Endpoint not found: [${req.method}] ${req.originalUrl}`));
};

/**
 * Centralized Error Handling Middleware
 * ดักจับทุก Error ในระบบ จัดรูปแบบ Response ให้เป็นมาตรฐานเดียวกัน และซ่อน Stack Trace ใน Production
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || null;

    // 1. จัดการ Zod Validation Error
    if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        details = err.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }));
    }

    // 2. จัดการ Database Errors (PostgreSQL / Knex)
    if (err.code === '23505') {
        statusCode = 409;
        message = 'Duplicate entry error: Unique constraint violated.';
        details = err.detail || null;
    } else if (err.code === '23503') {
        statusCode = 400;
        message = 'Foreign key constraint violated: Referenced item does not exist.';
        details = err.detail || null;
    }

    // 3. จัดการ Multer Upload Errors
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Uploaded file is too large. Maximum allowed size is 5MB.';
        } else {
            message = `File upload error: ${err.message}`;
        }
    }

    // 4. จัดการ JWT Token Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired. Please log in again.';
    }

    // 5. บันทึก Log เฉพาะ Server Error ระดับ 500
    if (statusCode >= 500) {
        console.error('💥 [Server Error]:', err);
    }

    const response = {
        success: false,
        status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
        message,
        ...(details && { details }),
        ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 && { stack: err.stack })
    };

    return res.status(statusCode).json(response);
};

module.exports = {
    notFoundHandler,
    errorHandler
};
