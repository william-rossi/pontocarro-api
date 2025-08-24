import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Import crypto for generating refresh tokens
import User from '../models/User'; // Import the Mongoose User model
import { z } from 'zod'; // Import zod for validation errors
import { createUserSchema } from '../schemas/userSchema'; // Import the user schema

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra um novo usuário
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
 *                 description: Nome completo do usuário
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Endereço de e-mail do usuário
 *                 example: joao.silva@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário (mínimo 8 caracteres)
 *                 example: MinhaSenhaForte123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirmação da senha
 *                 example: MinhaSenhaForte123!
 *               phone:
 *                 type: string
 *                 description: Número de telefone do usuário
 *                 example: (11) 99999-9999
 *               location:
 *                 type: string
 *                 description: Localização do usuário
 *                 example: São Paulo, SP
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
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
 *                   description: Token JWT para autenticação
 *                 userId:
 *                   type: string
 *                   description: ID do usuário criado
 *                 refreshToken:
 *                   type: string
 *                   description: Token de atualização para obter novos access tokens
 *       400:
 *         description: Erro de validação ou usuário já existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário com este e-mail já existe
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
 *         description: Erro do servidor
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
 *     summary: Autentica um usuário
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
 *                 description: E-mail do usuário
 *                 example: joao.silva@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário
 *                 example: MinhaSenhaForte123!
 *     responses:
 *       200:
 *         description: Login bem-sucedido
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
 *                   description: Token JWT para autenticação
 *                 userId:
 *                   type: string
 *                   description: ID do usuário logado
 *                 refreshToken:
 *                   type: string
 *                   description: Token de atualização para obter novos access tokens
 *       400:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Credenciais inválidas
 *       500:
 *         description: Erro do servidor
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
 *         description: Instruções de redefinição de senha enviadas (mock)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Instruções de redefinição de senha enviadas para o seu e-mail (mock)
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
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(200).json({ message: 'Instruções de redefinição de senha enviadas para o seu e-mail (mock)' });
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
