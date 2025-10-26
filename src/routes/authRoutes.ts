import express, { Router } from 'express';
import { registerUser, loginUser, forgotPassword, refreshAccessToken } from '../controllers/authController';

const router = Router();

router.use(express.json()); // Apply JSON body parsing for auth routes

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshAccessToken);

export default router;
