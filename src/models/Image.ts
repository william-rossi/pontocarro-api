import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface Image extends Document {
    vehicle_id: string; // Reference to the Vehicle model
    imageUrl: string;
    cloudinaryPublicId?: string; // Public ID for Cloudinary management
    created_at?: Date;
}

const imageSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    vehicle_id: { type: String, required: true, ref: 'Vehicle' },
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String }, // Optional field for Cloudinary public ID
    created_at: { type: Date, default: Date.now },
}, { _id: false });

export default model<Image>('Image', imageSchema);
