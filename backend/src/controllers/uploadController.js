// backend/src/controllers/uploadController.js
const storageService = require('../services/storageService');

const uploadSlip = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file uploaded' });
        }

        const result = await storageService.uploadImage(req.file, 'slips');
        return res.status(200).json({
            success: true,
            message: 'Slip uploaded successfully',
            imageUrl: result.publicUrl,
            filePath: result.filePath,
            isMock: result.isMock
        });
    } catch (error) {
        console.error('Upload slip error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const uploadMenuImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file uploaded' });
        }

        const result = await storageService.uploadImage(req.file, 'menus');
        return res.status(200).json({
            success: true,
            message: 'Menu image uploaded successfully',
            imageUrl: result.publicUrl,
            filePath: result.filePath,
            isMock: result.isMock
        });
    } catch (error) {
        console.error('Upload menu image error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const uploadStoreImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file uploaded' });
        }

        const result = await storageService.uploadImage(req.file, 'stores');
        return res.status(200).json({
            success: true,
            message: 'Store image uploaded successfully',
            imageUrl: result.publicUrl,
            filePath: result.filePath,
            isMock: result.isMock
        });
    } catch (error) {
        console.error('Upload store image error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    uploadSlip,
    uploadMenuImage,
    uploadStoreImage
};
