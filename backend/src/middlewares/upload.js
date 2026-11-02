// backend/src/middlewares/upload.js
const multer = require('multer');

// จัดเก็บไฟล์ใน Memory เพื่อส่งต่อให้ Supabase Storage โดยตรง
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // จำกัดขนาดไม่เกิน 5MB
    },
    fileFilter: fileFilter
});

module.exports = upload;
