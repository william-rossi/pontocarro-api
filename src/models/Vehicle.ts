import { Document, Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

export interface Vehicle extends Document {
    owner_id: Schema.Types.ObjectId;
    title: string;
    brand: string;
    vehicleModel: string;
    engine: string;
    year: number;
    price: number;
    mileage: number;
    state: string;
    city: string;
    fuel: string;
    transmission: string;
    bodyType: string;
    color: string;
    description: string;
    features?: string[];
    images?: string[]; // Change this to refer to Image IDs
    announcerName: string;
    announcerEmail: string;
    announcerPhone: string;
    created_at?: Date;
}

const vehicleSchema = new Schema({
    _id: { type: String, default: uuidv4 }, // Set _id to be generated as UUID
    owner_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    brand: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    engine: { type: String, required: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    mileage: { type: Number, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    fuel: { type: String, required: true },
    transmission: { type: String, required: true },
    bodyType: { type: String, required: true },
    color: { type: String, required: true },
    description: { type: String, required: true },
    features: { type: [String] },
    images: [{ type: String, ref: 'Image' }], // Updated to reference Image model
    announcerName: { type: String, required: true },
    announcerEmail: { type: String, required: true },
    announcerPhone: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { _id: false }); // Disable Mongoose's default _id generation

export default model<Vehicle>('Vehicle', vehicleSchema);
