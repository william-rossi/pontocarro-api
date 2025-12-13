import { v2 as cloudinary } from 'cloudinary';

// Instância do Cloudinary (será configurada posteriormente)
let cloudinaryInstance: typeof cloudinary;

// Função para configurar o Cloudinary (chamada após dotenv.config())
export const configureCloudinary = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.error('❌ Cloudinary configuration error: Missing required environment variables');
        console.error('Required variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
        console.error('Current values:', {
            CLOUDINARY_CLOUD_NAME: cloudName ? 'SET' : 'NOT SET',
            CLOUDINARY_API_KEY: apiKey ? 'SET' : 'NOT SET',
            CLOUDINARY_API_SECRET: apiSecret ? 'SET' : 'NOT SET'
        });
        throw new Error('Cloudinary configuration incomplete. Please check environment variables.');
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });

    cloudinaryInstance = cloudinary;
    return cloudinary;
};

// Getter para a instância configurada
const getCloudinary = () => {
    if (!cloudinaryInstance) {
        throw new Error('Cloudinary not configured. Call configureCloudinary() first.');
    }
    return cloudinaryInstance;
};

export default getCloudinary;