import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User'; // Importa o modelo de Usuário do Mongoose

interface AuthRequest extends Request {
    userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string }; // id agora é string para o _id do MongoDB
        req.userId = decoded.id; // Anexa o ID do usuário à requisição
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Não precisamos anexar o objeto de usuário completo se apenas o ID for usado
        // (req as any).user = user; 
        next();

    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
