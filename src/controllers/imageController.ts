import { Request, Response } from 'express';
import Image from '../models/Image';
import Vehicle from '../models/Vehicle';
import cloudinary from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';

const cleanCloudinaryUrl = (url: string, originalPublicId?: string) => {
    // Se temos o originalPublicId, construímos a URL correta diretamente
    if (originalPublicId) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dw5xqqlvl';
        // O originalPublicId retornado pelo Cloudinary já está correto
        return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${originalPublicId}`;
    }

    // Fallback para URLs antigas que podem precisar de correção
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        return url; // Não é uma URL web, retorna como está
    }

    try {
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.delete('_a');
        parsedUrl.protocol = 'https:';

        // Remove o segmento '/v1/' ou outras versões se existir
        parsedUrl.pathname = parsedUrl.pathname.replace(/\/v\d+\//, '/');

        return parsedUrl.toString();
    } catch (error) {
        console.warn('Falha ao limpar URL do Cloudinary:', url, error);
        return url; // Em caso de erro na URL, retorna a original
    }
};

export const uploadImages = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }

        const vehicleId = req.params.id;
        const ownerId = req.userId; // Usa req.userId conforme definido pelo middleware de autenticação

        if (!vehicleId || vehicleId.trim() === '') {
            return res.status(400).json({ message: 'Invalid vehicle ID' });
        }

        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to upload images for this vehicle' });
        }

        const newImageFiles = req.files as Express.Multer.File[];
        const existingImagesCount = await Image.countDocuments({ vehicle_id: vehicleId });
        if (existingImagesCount + newImageFiles.length > 10) {
            return res.status(400).json({ message: `Cannot upload more than 10 images. You already have ${existingImagesCount} images.` });
        }

        const imageUrls: string[] = [];
        const imageIds: string[] = [];

        for (const file of newImageFiles) {
            // Gera um ID público único para o Cloudinary (sem incluir pasta no public_id)
            const uniqueId = uuidv4();

            // Upload para Cloudinary usando asset_folder (Dynamic Folder Mode)

            const uploadResult = await cloudinary.uploader.upload(
                `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                {
                    public_id: uniqueId, // Apenas o ID único
                    asset_folder: `vehicles/${vehicleId}`, // Pasta de armazenamento
                    use_asset_folder_as_public_id_prefix: true, // Inclui pasta na URL
                    quality: 'auto', // Otimização automática do Cloudinary
                    width: 1920, // Redimensionamento automático (máximo 1920px de largura)
                    height: 1920,
                    crop: 'limit'
                }
            );

            // Se use_asset_folder_as_public_id_prefix não funcionou, construir manualmente
            const finalPublicId = uploadResult.public_id.includes('vehicles/')
                ? uploadResult.public_id
                : `vehicles/${vehicleId}/${uploadResult.public_id}`;

            // Construir URL com a pasta incluída
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${finalPublicId}`;

            const newImage = new Image({
                vehicle_id: vehicleId,
                imageUrl: optimizedUrl,
                cloudinaryPublicId: finalPublicId // Armazenar o public_id completo retornado pelo Cloudinary
            });
            const savedImage = await newImage.save();
            imageUrls.push(optimizedUrl);
            imageIds.push(savedImage._id.toString());
        }

        res.status(200).json({ message: 'Images uploaded successfully', images: imageUrls, imageIds: imageIds });

    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error uploading images', error: err.message });
    }
};

export const getImagesByVehicleId = async (req: Request, res: Response) => {
    try {
        const { vehicleId } = req.params;
        const images = await Image.find({ vehicle_id: vehicleId });

        if (images.length === 0) {
            return res.status(404).json({ message: 'No images found for this vehicle.' });
        }

        res.status(200).json(images.map(image => {
            const imageObject = image.toJSON();
            const cleanedImageUrl = cleanCloudinaryUrl(imageObject.imageUrl, imageObject.cloudinaryPublicId);
            delete imageObject.cloudinaryPublicId; // Remove a propriedade do retorno JSON
            return { ...imageObject, imageUrl: cleanedImageUrl };
        }));
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching images', error: err.message });
    }
};

export const getFirstImageByVehicleId = async (req: Request, res: Response) => {
    try {
        const { vehicleId } = req.params;
        const image = await Image.findOne({ vehicle_id: vehicleId }).sort({ created_at: 1 }); // Obtém a primeira imagem por data de criação

        if (!image) {
            return res.status(404).json({ message: 'No images found for this vehicle.' });
        }

        const imageObject = image.toJSON();
        const cleanedImageUrl = cleanCloudinaryUrl(imageObject.imageUrl, imageObject.cloudinaryPublicId);
        delete imageObject.cloudinaryPublicId; // Remove a propriedade do retorno JSON
        res.status(200).json({ ...imageObject, imageUrl: cleanedImageUrl });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching first image', error: err.message });
    }
};

export const getImageById = async (req: Request, res: Response) => {
    try {
        const { imageId } = req.params;
        const image = await Image.findById(imageId);

        if (!image) {
            return res.status(404).json({ message: 'Image not found.' });
        }

        const imageObject = image.toJSON();
        const cleanedImageUrl = cleanCloudinaryUrl(imageObject.imageUrl, imageObject.cloudinaryPublicId);
        delete imageObject.cloudinaryPublicId; // Remove a propriedade do retorno JSON
        res.status(200).json({ ...imageObject, imageUrl: cleanedImageUrl });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching image', error: err.message });
    }
};

export const deleteImage = async (req: Request, res: Response) => {
    try {
        const { id, imageId } = req.params; // id é vehicleId, imageId é o _id da imagem
        const ownerId = req.userId; // ID do usuário do middleware de autenticação

        // Verifica se o veículo existe e pertence ao usuário
        const vehicle = await Vehicle.findOne({ _id: id, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to delete images for this vehicle' });
        }

        // Encontra a imagem para deletar
        const imageToDelete = await Image.findOne({ _id: imageId, vehicle_id: id });

        if (!imageToDelete) {
            return res.status(404).json({ message: 'Image not found for this vehicle.' });
        }

        // Exclui a imagem do Cloudinary se existir um public_id
        if (imageToDelete.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(imageToDelete.cloudinaryPublicId);
        }

        // Remove a imagem do banco de dados
        await Image.deleteOne({ _id: imageId });

        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting image', error: err.message });
    }
};