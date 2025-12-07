import { Schema, model, Document } from 'mongoose';

export interface User extends Document {
    username: string;
    email: string;
    password?: string;
    phone?: string;
    city?: string;
    state?: string;
    refreshToken?: string; // Add refreshToken to the User interface
    resetPasswordToken?: string; // Add resetPasswordToken
    resetPasswordExpires?: Date; // Add resetPasswordExpires
    created_at?: Date;
}

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true }, // Add phone field to schema
    city: { type: String },
    state: { type: String },
    refreshToken: { type: String }, // Add refreshToken to the schema
    resetPasswordToken: { type: String }, // Add resetPasswordToken to schema
    resetPasswordExpires: { type: Date }, // Add resetPasswordExpires to schema
    created_at: { type: Date, default: Date.now }
});

export default model<User>('User', userSchema);
