// backend/src/services/storageService.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'behind-north-bangkok';
const menuImagesBucketName = process.env.SUPABASE_MENU_IMAGES_BUCKET || 'menu-images';

let supabase = null;

// สร้าง Supabase Client เมื่อมีการตั้งค่า Environment Variables
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false
        }
    });
} else {
    console.warn('Supabase credentials are not configured. Image upload is unavailable.');
}

/**
 * ตรวจสอบความพร้อมของ Bucket หากยังไม่มีให้พยายามสร้าง
 */
const ensureBucketExists = async () => {
    if (!supabase) return;
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error listing Supabase buckets:', error.message);
            return;
        }

        const exists = buckets?.some(b => b.name === bucketName);
        if (!exists) {
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true
            });
            if (createError) {
                console.error(`Failed to create bucket ${bucketName}:`, createError.message);
            } else {
                console.log(`✅ Supabase bucket '${bucketName}' created successfully.`);
            }
        }
    } catch (err) {
        console.error('ensureBucketExists error:', err.message);
    }
};

/**
 * อัปโหลดไฟล์ขึ้น Supabase Storage
 * @param {Object} file - Object จาก Multer (req.file)
 * @param {string} folder - โฟลเดอร์ปลายทาง เช่น 'slips', 'menus', 'stores'
 * @returns {Promise<{ publicUrl: string, filePath: string }>}
 */
const uploadImage = async (file, folder = 'general') => {
    if (!file || !file.buffer) {
        throw new Error('No file buffer provided');
    }

    const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    const randomHash = crypto.randomBytes(6).toString('hex');
    const fileName = `${Date.now()}_${randomHash}${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    const targetBucket = bucketForFolder(folder);

    // ห้ามส่ง URL จำลองกลับไปให้ client เพราะไฟล์จะเปิดไม่ได้จริง
    if (!supabase) {
        throw new Error('Image storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    // อัปโหลดไฟล์ขึ้น Supabase
    const { data, error } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    // ดึง Public URL ของไฟล์
    const { data: urlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

    return {
        publicUrl: urlData.publicUrl,
        filePath
    };
};

/**
 * ลบไฟล์เดี่ยวตาม File Path
 * @param {string} filePath - เช่น 'slips/1730450000_abc123.jpg'
 */
const deleteImage = async (filePath) => {
    if (!supabase || !filePath) return false;
    const targetBucket = bucketForFolder(filePath);

    try {
        const { error } = await supabase.storage
            .from(targetBucket)
            .remove([filePath]);

        if (error) {
            console.error('Supabase delete error:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('deleteImage error:', err);
        return false;
    }
};

const bucketForFolder = (folder) => (
    String(folder).split('/')[0] === 'menus' ? menuImagesBucketName : bucketName
);

/**
 * ล้างไฟล์รูปภาพที่อายุเกินที่กำหนดออกจาก Supabase Storage (ค่าเริ่มต้น: 7 วัน / 1 สัปดาห์)
 * @param {number} olderThanDays - จำนวนวันที่เกิน เช่น 7 วัน
 * @param {string} folder - โฟลเดอร์ที่ต้องการกวาดล้าง เช่น 'slips'
 * @returns {Promise<number>} - จำนวนไฟล์ที่ถูกลบ
 */
const cleanupOldImages = async (olderThanDays = 7, folder = 'slips') => {
    if (!supabase) return 0;

    try {
        const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list(folder, {
                limit: 200,
                sortBy: { column: 'created_at', order: 'asc' }
            });

        if (error || !files || files.length === 0) {
            return 0;
        }

        const now = Date.now();
        const maxAgeMs = olderThanDays * 24 * 60 * 60 * 1000;

        const filesToDelete = files
            .filter(file => {
                if (!file.created_at) return false;
                const fileAge = now - new Date(file.created_at).getTime();
                return fileAge > maxAgeMs;
            })
            .map(file => `${folder}/${file.name}`);

        if (filesToDelete.length === 0) {
            return 0;
        }

        const { error: removeError } = await supabase.storage
            .from(bucketName)
            .remove(filesToDelete);

        if (removeError) {
            console.error('Failed to cleanup old images from Supabase:', removeError);
            return 0;
        }

        console.log(`[Storage Cleanup] Removed ${filesToDelete.length} files older than ${olderThanDays} days from '${folder}'`);
        return filesToDelete.length;

    } catch (err) {
        console.error('Error during cleanupOldImages:', err);
        return 0;
    }
};

module.exports = {
    ensureBucketExists,
    uploadImage,
    deleteImage,
    cleanupOldImages
};
