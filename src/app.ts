import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { apiReference } from '@scalar/express-api-reference';
import { initializeDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import imageRoutes from './routes/imageRoutes';
import { openApiSpec } from './schemas/scalarSchema';
import configureCloudinary from './config/cloudinary';

dotenv.config();

// Configurar Cloudinary após carregar as variáveis de ambiente
configureCloudinary();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://pontocarro.com'
    ]
}));

initializeDatabase();

// Documentação da API com Scalar
app.use('/api-docs', apiReference({
    theme: 'default',
    content: openApiSpec,
    metaData: {
        title: 'PontoCarro API',
        description: 'Documentação da API para a aplicação PontoCarro',
    },
    hideDownloadButton: true,
    hideTestRequestButton: false,
    showSidebar: true,
}));

// Usa as rotas
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/images', imageRoutes);

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
