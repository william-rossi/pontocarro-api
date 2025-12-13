import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import transporter from '../config/email';
import User from '../models/User';
import { z } from 'zod';
import { createUserSchema, forgotPasswordSchema } from '../schemas/userSchema'; // Importa o esquema de usuário e o esquema de forgotPassword

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const registerUser = async (req: Request, res: Response) => {
    try {
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

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        // Validação do email
        const { email } = forgotPasswordSchema.parse(req.body);

        // Busca do usuário
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Gera um token de redefinição
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora

        // Salva o usuário com o token
        await user.save();

        // Verifica se FRONTEND_DOMAIN está configurado
        if (!process.env.FRONTEND_DOMAIN) {
            console.error('FRONTEND_DOMAIN não configurado');
            return res.status(500).json({ message: 'Configuração do servidor incompleta' });
        }

        const resetUrl = `${process.env.FRONTEND_DOMAIN}/redefinir-senha/${resetToken}`;

        // Verifica se GMAIL_ADDRESS está configurado
        if (!process.env.GMAIL_ADDRESS) {
            console.error('GMAIL_ADDRESS não configurado');
            return res.status(500).json({ message: 'Configuração de email incompleta' });
        }

        const mailOptions = {
            to: user.email,
            from: process.env.GMAIL_ADDRESS,
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

        // Tenta enviar o email com retry e timeout
        let emailSent = false;
        let lastError: any = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`Tentativa ${attempt} de envio de email para ${user.email}`);
                await transporter.sendMail(mailOptions);
                emailSent = true;
                console.log(`Email enviado com sucesso na tentativa ${attempt}`);
                break;
            } catch (emailError: any) {
                console.error(`Erro na tentativa ${attempt} ao enviar email:`, emailError);
                lastError = emailError;

                // Se for erro de autenticação, não tentar novamente
                if (emailError.code === 'EAUTH' || emailError.code === 'EENVELOPE') {
                    break;
                }

                // Esperar antes de tentar novamente (exceto na última tentativa)
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Espera crescente
                }
            }
        }

        if (!emailSent) {
            // Limpa o token se o email falhar
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            // Retorna erro específico baseado no tipo de erro
            if (lastError.code === 'EAUTH') {
                return res.status(500).json({ message: 'Erro de autenticação no serviço de email. Verifique as credenciais.' });
            } else if (lastError.code === 'ECONNREFUSED' || lastError.code === 'ETIMEDOUT') {
                return res.status(500).json({ message: 'Não foi possível conectar ao serviço de email. Tente novamente mais tarde.' });
            } else if (lastError.code === 'EENVELOPE') {
                return res.status(500).json({ message: 'Endereço de email inválido ou rejeitado pelo servidor.' });
            } else {
                return res.status(500).json({ message: 'Erro ao enviar e-mail de redefinição de senha. Tente novamente mais tarde.' });
            }
        }

        res.status(200).json({ message: 'Instruções de redefinição de senha enviadas para o seu e-mail' });
    } catch (err: any) {
        console.error('Erro no forgotPassword:', err);

        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Erro de validação', errors: err.issues });
        }

        res.status(500).json({ message: 'Erro do servidor ao processar solicitação de redefinição de senha' });
    }
};

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
