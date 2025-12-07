import express, { Router } from 'express';
import { deleteUserAccount, updateUserProfile } from '../controllers/userController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.use(express.json()); // Aplica o parsing do corpo JSON para as rotas de usuário

router.put('/:id/update', authenticateUser, updateUserProfile);
router.delete('/delete', authenticateUser, deleteUserAccount);

export default router;
