import { Router } from 'express';
import { deleteUserAccount, updateUserProfile } from '../controllers/userController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.put('/profile', authenticateUser, updateUserProfile);
router.delete('/delete', authenticateUser, deleteUserAccount);

export default router;
