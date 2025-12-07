import { Schema, model, Document } from 'mongoose';

export interface User extends Document {
    username: string;
    email: string;
    password?: string;
    phone?: string;
    city?: string;
    state?: string;
    refreshToken?: string; // Adiciona refreshToken à interface User
    resetPasswordToken?: string; // Adiciona resetPasswordToken
    resetPasswordExpires?: Date; // Adiciona resetPasswordExpires
    created_at?: Date;
}

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true }, // Adiciona o campo phone ao esquema
    city: { type: String },
    state: { type: String },
    refreshToken: { type: String }, // Adiciona refreshToken ao esquema
    resetPasswordToken: { type: String }, // Adiciona resetPasswordToken ao esquema
    resetPasswordExpires: { type: Date }, // Adiciona resetPasswordExpires ao esquema
    created_at: { type: Date, default: Date.now }
});

export default model<User>('User', userSchema);
