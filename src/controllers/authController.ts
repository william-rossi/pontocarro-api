import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Import crypto for generating tokens
import transporter from '../config/email'; // Import Nodemailer transporter
import User from '../models/User'; // Import the Mongoose User model
import { z } from 'zod'; // Import zod for validation errors
import { createUserSchema, forgotPasswordSchema } from '../schemas/userSchema'; // Import the user schema and forgotPasswordSchema

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's full name
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *                 example: joao.silva@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 8 characters)
 *                 example: Senha@123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Password confirmation
 *                 example: Senha@123
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *                 example: '+55 (11) 98765-4321'
 *               city:
 *                 type: string
 *                 description: User's city
 *                 example: São Paulo
 *               state:
 *                 type: string
 *                 description: User's state
 *                 example: SP
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário registrado com sucesso
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1Ni...
 *                 userId:
 *                   type: string
 *                   example: 60f...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1Ni...
 *       400:
 *         description: Validation Error or User Exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro de validação
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *       500:
 *         description: Server Error
 */
export const registerUser = async (req: Request, res: Response) => {
    try {
        // Validate request body with zod schema
        const validatedData = createUserSchema.parse(req.body);

        const { username, email, password, phone, city, state } = validatedData;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Usuário com este e-mail já existe' });
        }

        if (phone) {
            const existingPhoneUser = await User.findOne({ phone });
            if (existingPhoneUser) {
                return res.status(400).json({ message: 'Usuário com este telefone já existe' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            phone,
            city,
            state
        });

        await newUser.save();

        const accessToken = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

        // Generate a JWT refresh token
        const refreshToken = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' }); // Refresh token valid for 7 days

        newUser.refreshToken = refreshToken; // Store the JWT refresh token directly
        await newUser.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso', accessToken, userId: newUser._id, refreshToken });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Erro de validação', errors: err.issues });
        }
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor' });
    }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *                 example: joao.silva@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: Senha@123
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login bem-sucedido
 *                 accessToken:
 *                   type: string
 *                   description: JWT for authentication
 *                 user:
 *                   type: object
 *                   description: Logged in user object (excluding password and refreshToken)
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                 refreshToken:
 *                   type: string
 *                   description: Token to get new access tokens
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Credenciais inválidas
 *       500:
 *         description: Server Error
 */
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        const accessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Generate a new JWT refresh token for login
        const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' }); // Refresh token valid for 7 days

        user.refreshToken = newRefreshToken; // Store the JWT refresh token directly
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.refreshToken;

        res.status(200).json({ message: 'Login bem-sucedido', accessToken, user: userResponse, refreshToken: newRefreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor' });
    }
};

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicita redefinição de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: E-mail do usuário para redefinição de senha
 *                 example: joao.silva@example.com
 *     responses:
 *       200:
 *         description: Instruções de redefinição de senha enviadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Instruções de redefinição de senha enviadas para o seu e-mail
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário não encontrado
 *       500:
 *         description: Erro do servidor
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_DOMAIN}/redefinir-senha/${resetToken}`;

        const mailOptions = {
            to: user.email,
            from: '.CARRO',
            subject: '.CARRO: Redefinição de Senha',
            html: `
                Olá ${user.username || 'usuário'},
                <p>Recebemos uma solicitação para redefinir a senha da sua conta .CARRO.</p>
                <p>Para prosseguir com a redefinição, por favor, clique no link abaixo:</p>
                <h3><a href="${resetUrl}" style="color: #007bff; text-decoration: none;">Redefinir minha senha</a></h3>
                <p>Este link é válido por <b>1 hora</b>.</p>
                <p>Se você não solicitou esta redefinição de senha, por favor, ignore este e-mail ou entre em contato com o suporte.</p>
                <p>Obrigado,<br/>Equipe .CARRO</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Instruções de redefinição de senha enviadas para o seu e-mail' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor ao enviar e-mail de redefinição de senha' });
    }
};

/**
 * @swagger
 * /auth/reset-password/{resetToken}:
 *   post:
 *     summary: Redefine a user's password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: resetToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password (min 8 characters)
 *                 example: NovaSenha@123
 *     responses:
 *       200:
 *         description: Password redefined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Senha redefinida com sucesso!
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido ou expirado
 *       500:
 *         description: Server Error
 */
export const resetPassword = async (req: Request, res: Response) => {
    const { resetToken } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: new Date() }, // Check if the token is not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Token de redefinição de senha inválido ou expirado.' });
        }

        // Validate new password with zod schema (assuming createUserSchema is appropriate)
        const passwordSchema = createUserSchema.pick({ password: true });
        passwordSchema.parse({ password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined; // Clear the reset token
        user.resetPasswordExpires = undefined; // Clear the expiration time
        await user.save();

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Erro de validação', errors: err.issues });
        }
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor ao redefinir senha' });
    }
};

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Gera um novo access token usando um refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Token de atualização do usuário
 *                 example: seu_refresh_token_aqui
 *     responses:
 *       200:
 *         description: Novo access token gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Novo access token gerado com sucesso
 *                 accessToken:
 *                   type: string
 *                   description: Novo access token JWT
 *       401:
 *         description: Refresh token inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Refresh token inválido ou expirado
 *       500:
 *         description: Erro do servidor
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token não fornecido' });
    }

    try {
        // Verify the refresh token as a JWT
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string };

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
        }

        // Generate a new access token
        const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Optionally, generate a new refresh token and update in DB for rotating refresh tokens
        const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({ message: 'Novo access token gerado com sucesso', accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error(err);
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
        }
        res.status(500).json({ message: 'Erro do servidor' });
    }
};
