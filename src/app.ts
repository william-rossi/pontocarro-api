import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Importa o pacote cors para lidar com requisições de diferentes origens
import fs from 'fs'; // Importa o módulo fs para operações de sistema de arquivos
import path from 'path'; // Importa o módulo path para lidar com caminhos de arquivos e diretórios
import { initializeDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import imageRoutes from './routes/imageRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Cria o diretório de uploads se ele não existir
const uploadDir = path.join(__dirname, '../uploads/vehicles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://pontocarro.com'
    ]
}));

// Serve arquivos estáticos do diretório 'uploads'
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Definição do Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'PontoCarro API',
            version: '1.0.0',
            description: 'Documentação da API para a aplicação PontoCarro',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Servidor de desenvolvimento',
            },
        ],
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/routes/imageRoutes.ts', './src/schemas/swaggerSchemas.ts'], // Caminho para a documentação da API, adicionado swaggerSchemas.ts
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Inicializa o banco de dados na inicialização do servidor
initializeDatabase();

// Usa o Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Usa as rotas
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/images', imageRoutes);

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
