import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User'; // Import the Mongoose User model

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string }; // id is now string for MongoDB _id
        (req as any).userId = decoded.id; // Attach user ID to request
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // We don't need to attach the full user object if only the ID is used
        // (req as any).user = user; 
        next();

    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
