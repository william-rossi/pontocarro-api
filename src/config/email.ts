import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD, // Use uma variável de ambiente para a senha do aplicativo
    },
});

export default transporter;
