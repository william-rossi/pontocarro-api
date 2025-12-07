import multer, { Multer } from 'multer';
import { Request } from 'express';

// Configure storage for Multer
const storage = multer.memoryStorage(); // Store files in memory as buffers

// File filter to accept only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(null, false); // Change to null for error argument
    }
};

// Initialize Multer upload
export const uploadVehicleImages = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).array('images', 10); // Max 10 images, 10MB each
