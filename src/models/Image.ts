import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface Image extends Document {
    _id: string;
    vehicle_id: string; // Reference to the Vehicle model
    imageUrl: string;
    created_at?: Date;
}

const imageSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    vehicle_id: { type: String, required: true, ref: 'Vehicle' },
    imageUrl: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
}, { _id: false });

export default model<Image>('Image', imageSchema);
