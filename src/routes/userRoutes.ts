import express, { Router } from 'express';
import { deleteUserAccount, updateUserProfile } from '../controllers/userController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.use(express.json()); // Apply JSON body parsing for user routes

router.put('/profile', authenticateUser, updateUserProfile);
router.delete('/delete', authenticateUser, deleteUserAccount);

export default router;
