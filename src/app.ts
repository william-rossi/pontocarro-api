import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import { initializeDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import vehicleRoutes from './routes/vehicleRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors()); // Use cors middleware

// Initialize database on server start
initializeDatabase();

// Use routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/vehicles', vehicleRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
