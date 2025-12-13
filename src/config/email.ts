import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Validação das variáveis de ambiente
if (!process.env.GMAIL_ADDRESS || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Variáveis de ambiente GMAIL_ADDRESS e GMAIL_APP_PASSWORD são obrigatórias');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD, // Use uma variável de ambiente para a senha do aplicativo
    },
    // Configurações corretas para Gmail SMTP
    secure: false, // false para STARTTLS (porta 587), true para SSL (porta 465)
    port: 587, // Porta 587 para STARTTLS
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    },
    // Configurações de pool e timeout
    pool: true,
    maxConnections: 1, // Reduzido para evitar bloqueios
    maxMessages: 5,
    rateLimit: 100, // Máximo 100 emails por hora
    rateDelta: 1000 * 60 * 60, // 1 hora
    // Timeouts
    connectionTimeout: 60000, // 60 segundos
    greetingTimeout: 30000, // 30 segundos
    socketTimeout: 60000, // 60 segundos
});

// Verificar se o transporter está funcionando (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
    transporter.verify((error, success) => {
        if (error) {
            console.error('Erro na configuração do transporter:', error);
        } else {
            console.log('Transporter configurado com sucesso');
        }
    });
}

export default transporter;
