import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import fs from 'fs'; // Import fs
import path from 'path'; // Import path
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

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/vehicles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors()); // Use cors middleware

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger definition
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'PontoCarro API',
            version: '1.0.0',
            description: 'API documentation for the PontoCarro application',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
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
    apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/routes/imageRoutes.ts', './src/schemas/swaggerSchemas.ts'], // Path to the API docs, added swaggerSchemas.ts
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Initialize database on server start
initializeDatabase();

// Use Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Use routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/images', imageRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
