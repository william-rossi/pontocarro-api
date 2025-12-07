import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Importa crypto para gerar tokens
import transporter from '../config/email'; // Importa o transportador do Nodemailer
import User from '../models/User'; // Importa o modelo de Usuário do Mongoose
import { z } from 'zod'; // Importa zod para erros de validação
import { createUserSchema, forgotPasswordSchema } from '../schemas/userSchema'; // Importa o esquema de usuário e o esquema de forgotPassword

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar um novo usuário
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
 *                 description: E-mail do usuário
 *                 example: joao.silva@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário (mínimo 8 caracteres)
 *                 example: Senha@123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirmação de senha
 *                 example: Senha@123
 *               phone:
 *                 type: string
 *                 description: Número de telefone do usuário
 *                 example: '+55 (11) 98765-4321'
 *               city:
 *                 type: string
 *                 description: Cidade do usuário
 *                 example: São Paulo
 *               state:
 *                 type: string
 *                 description: Estado do usuário
 *                 example: SP
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
 *                   example: eyJhbGciOiJIUzI1Ni...
 *                 userId:
 *                   type: string
 *                   example: 60f...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1Ni...
 *       400:
 *         description: Erro de Validação ou Usuário Existente
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
 *         description: Erro do Servidor
 */
export const registerUser = async (req: Request, res: Response) => {
    try {
        // Valida o corpo da requisição com o esquema zod
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

        // Gera um refresh token JWT
        const refreshToken = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' }); // Refresh token válido por 7 dias

        newUser.refreshToken = refreshToken; // Armazena o refresh token JWT diretamente
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
 *     summary: Autenticar um usuário
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
 *                 example: Senha@123
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
 *                   description: JWT para autenticação
 *                 user:
 *                   type: object
 *                   description: Objeto de usuário logado (excluindo senha e refreshToken)
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
 *                   description: Token para obter novos access tokens
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
 *         description: Erro do Servidor
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

        // Gera um novo refresh token JWT para login
        const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' }); // Refresh token válido por 7 dias

        user.refreshToken = newRefreshToken; // Armazena o refresh token JWT diretamente
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

        // Gera um token de redefinição
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
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
 *     summary: Redefine a senha de um usuário
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: resetToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de redefinição de senha
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
 *                 description: Nova senha (mínimo 8 caracteres)
 *                 example: NovaSenha@123
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Senha redefinida com sucesso!
 *       400:
 *         description: Requisição inválida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido ou expirado
 *       500:
 *         description: Erro do Servidor
 */
export const resetPassword = async (req: Request, res: Response) => {
    const { resetToken } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: new Date() }, // Verifica se o token não expirou
        });

        if (!user) {
            return res.status(400).json({ message: 'Token de redefinição de senha inválido ou expirado.' });
        }

        // Valida a nova senha com o esquema zod (assumindo que createUserSchema é apropriado)
        const passwordSchema = createUserSchema.pick({ password: true });
        passwordSchema.parse({ password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined; // Limpa o token de redefinição
        user.resetPasswordExpires = undefined; // Limpa o tempo de expiração
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
 *     summary: Gerar um novo access token usando um refresh token
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
        // Verifica o refresh token como um JWT
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string };

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
        }

        // Gera um novo access token
        const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Opcionalmente, gera um novo refresh token e atualiza no DB para rotação de refresh tokens
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