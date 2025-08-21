import { Router } from 'express';
import { registerUser, loginUser, forgotPassword, refreshAccessToken } from '../controllers/authController';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshAccessToken);

export default router;
