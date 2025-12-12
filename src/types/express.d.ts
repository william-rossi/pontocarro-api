import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            userId?: string; // Add userId to the Request interface
            user?: any; // Keep this if you still attach the full user object elsewhere
            files?: Express.Multer.File[]; // Add files property for Multer uploads
        }
    }
}

