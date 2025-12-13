import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Validação das variáveis de ambiente
if (!process.env.GMAIL_ADDRESS || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Variáveis de ambiente GMAIL_ADDRESS e GMAIL_APP_PASSWORD são obrigatórias');
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

export default transporter;
