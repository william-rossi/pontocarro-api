import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import swaggerUi from 'swagger-ui-express'; // Import swagger-ui-express
import swaggerSpec from './config/swagger.config'; // Import swagger config from new location
import { initializeDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import carRoutes from './routes/carRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors()); // Use cors middleware

// Serve Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize database on server start
initializeDatabase();

// Use routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/cars', carRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
