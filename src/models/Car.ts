import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

export interface Car extends Document {
    _id: string; // Define _id as string for GUID and make it required
    owner_id: Schema.Types.ObjectId;
    make: string;
    carModel: string;
    year: number;
    price?: number | null;
    description?: string;
    location?: string; // Add location field
    engineType?: string; // New field
    vehicleType?: string; // New field
    fuelType?: string; // New field
    transmission?: string; // New field
    mileage?: number | null; // New field
    created_at?: Date;
}

const carSchema = new Schema({
    _id: { type: String, default: uuidv4 }, // Set _id to be generated as UUID
    owner_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    make: { type: String, required: true },
    carModel: { type: String, required: true },
    year: { type: Number, required: true },
    price: { type: Number },
    description: { type: String },
    location: { type: String }, // Add location field to schema
    engineType: { type: String }, // New field in schema
    vehicleType: { type: String }, // New field in schema
    fuelType: { type: String }, // New field in schema
    transmission: { type: String }, // New field in schema
    mileage: { type: Number }, // New field in schema
    created_at: { type: Date, default: Date.now }
}, { _id: false }); // Disable Mongoose's default _id generation

export default model<Car>('Car', carSchema);
