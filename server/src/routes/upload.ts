import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.'));
    }
  },
});

// Upload single file
router.post(
  '/',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
        // Fallback to local if Cloudinary not configured
        const base64 = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64}`;
        return res.json({ success: true, data: { url: dataUri, filename: req.file.originalname } });
      }

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'event-management',
            resource_type: 'auto',
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file!.buffer);
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
    } catch (error) {
      next(error);
    }
  }
);

// Upload multiple files
router.post(
  '/multiple',
  authenticate,
  upload.array('files', 10),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const uploadResults = await Promise.all(
        files.map(async (file) => {
          if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
            const base64 = file.buffer.toString('base64');
            return { url: `data:${file.mimetype};base64,${base64}`, filename: file.originalname };
          }

          return new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: 'event-management', resource_type: 'auto' },
              (error, result) => {
                if (error) reject(error);
                else resolve({ url: result!.secure_url, publicId: result!.public_id, filename: file.originalname });
              }
            );
            uploadStream.end(file.buffer);
          });
        })
      );

      res.json({ success: true, data: uploadResults });
    } catch (error) {
      next(error);
    }
  }
);

// Delete file
router.delete('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.query;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID is required' });
    }

    if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
      await cloudinary.uploader.destroy(publicId as string);
    }

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
