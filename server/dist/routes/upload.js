"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloudinaryCloudName,
    api_key: config_1.config.cloudinaryApiKey,
    api_secret: config_1.config.cloudinaryApiSecret,
});
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.'));
        }
    },
});
// Upload single file
router.post('/', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        if (!config_1.config.cloudinaryCloudName || !config_1.config.cloudinaryApiKey || !config_1.config.cloudinaryApiSecret) {
            // Fallback to local if Cloudinary not configured
            const base64 = req.file.buffer.toString('base64');
            const dataUri = `data:${req.file.mimetype};base64,${base64}`;
            return res.json({ success: true, data: { url: dataUri, filename: req.file.originalname } });
        }
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'event-management',
                resource_type: 'auto',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' },
                ],
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            uploadStream.end(req.file.buffer);
        });
        res.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                filename: req.file.originalname,
                size: result.bytes,
                format: result.format,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// Upload multiple files
router.post('/multiple', auth_1.authenticate, upload.array('files', 10), async (req, res, next) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }
        const uploadResults = await Promise.all(files.map(async (file) => {
            if (!config_1.config.cloudinaryCloudName || !config_1.config.cloudinaryApiKey || !config_1.config.cloudinaryApiSecret) {
                const base64 = file.buffer.toString('base64');
                return { url: `data:${file.mimetype};base64,${base64}`, filename: file.originalname };
            }
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: 'event-management', resource_type: 'auto' }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve({ url: result.secure_url, publicId: result.public_id, filename: file.originalname });
                });
                uploadStream.end(file.buffer);
            });
        }));
        res.json({ success: true, data: uploadResults });
    }
    catch (error) {
        next(error);
    }
});
// Delete file
router.delete('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { publicId } = req.query;
        if (!publicId) {
            return res.status(400).json({ success: false, message: 'Public ID is required' });
        }
        if (config_1.config.cloudinaryCloudName && config_1.config.cloudinaryApiKey && config_1.config.cloudinaryApiSecret) {
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
        res.json({ success: true, message: 'File deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map