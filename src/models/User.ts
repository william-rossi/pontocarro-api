import { Schema, model, Document } from 'mongoose';

export interface User extends Document {
    username: string;
    email: string;
    password?: string;
    phone?: string; // New field for phone number
    location?: string; // New field for user location
    created_at?: Date;
    refreshToken?: string; // New field for refresh token
}

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true }, // Add phone field to schema
    location: { type: String }, // Add location field to schema
    created_at: { type: Date, default: Date.now },
    refreshToken: { type: String } // Add refresh token field to schema
});

export default model<User>('User', userSchema);
