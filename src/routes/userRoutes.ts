import { Router } from 'express';
import { updateUserProfile } from '../controllers/userController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.put('/profile', authenticateUser, updateUserProfile);

export default router;
