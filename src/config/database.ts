import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function initializeDatabase() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/car_marketplace';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB database!');

        // No need to create tables in MongoDB as it's schema-less
    } catch (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
}

// No need to export a pool object for Mongoose
