import { Request, Response } from 'express';
import Image from '../models/Image';
import Vehicle from '../models/Vehicle';
import cloudinary from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid'; // Para gerar nomes de arquivo únicos

const cleanCloudinaryUrl = (url: string, originalPublicId?: string) => {
    // Se temos o originalPublicId, construímos a URL correta diretamente
    if (originalPublicId && originalPublicId.includes('vehicles/')) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dw5xqqlvl';
        // Mantém o publicId como está (sem forçar webp por enquanto)
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

        let finalUrl = parsedUrl.toString();

        // Mantém a URL como está (não adiciona extensão automaticamente)

        return finalUrl;
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

        // Verifica se o veículo existe e pertence ao usuário
        console.log('Checking vehicle with ID:', vehicleId, 'and ownerId:', ownerId);
        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner_id: ownerId });

        if (!vehicle) {
            console.log('Vehicle not found for upload');
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to upload images for this vehicle' });
        }
        console.log('Vehicle found, proceeding with upload');

        const newImageFiles = req.files as Express.Multer.File[];

        // Verifica o limite total de imagens (existentes + novas)
        const existingImagesCount = await Image.countDocuments({ vehicle_id: vehicleId });
        if (existingImagesCount + newImageFiles.length > 10) {
            return res.status(400).json({ message: `Cannot upload more than 10 images. You already have ${existingImagesCount} images.` });
        }

        const imageUrls: string[] = [];
        const imageIds: string[] = [];

        for (const file of newImageFiles) {
            // Gera um ID público único para o Cloudinary, usando webp como formato
            const publicIdWithFolder = `vehicles/${vehicleId}/${uuidv4()}`;
            console.log('Uploading image with publicId:', publicIdWithFolder);

            // Upload para Cloudinary com otimização automática
            const uploadResult = await cloudinary.uploader.upload(
                `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                {
                    public_id: publicIdWithFolder, // Public ID com pasta vehicles/
                    quality: 'auto', // Otimização automática do Cloudinary
                    width: 1920, // Redimensionamento automático (máximo 1920px de largura)
                    height: 1920,
                    crop: 'limit'
                }
            );

            // Usa o public_id retornado pelo Cloudinary (já inclui a pasta vehicles/)
            const finalPublicId = uploadResult.public_id;

            // A URL otimizada usa o public_id retornado
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${finalPublicId}`;

            const newImage = new Image({
                vehicle_id: vehicleId,
                imageUrl: optimizedUrl,
                cloudinaryPublicId: finalPublicId // Armazenar o public_id completo com extensão
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

/**
 * @swagger
 * /images/{vehicleId}:
 *   get:
 *     summary: Obtém todas as imagens de um veículo específico
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo para o qual as imagens serão recuperadas
 *     responses:
 *       200:
 *         description: Lista de imagens para o veículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Image'
 *       404:
 *         description: Nenhuma imagem encontrada para este veículo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /images/{vehicleId}/first:
 *   get:
 *     summary: Obtém a primeira imagem de um veículo específico
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo para o qual a primeira imagem será recuperada
 *     responses:
 *       200:
 *         description: Primeira imagem encontrada para o veículo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Image'
 *       404:
 *         description: Nenhuma imagem encontrada para este veículo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /images/{imageId}:
 *   get:
 *     summary: Obtém uma imagem específica pelo seu ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da imagem a ser recuperada
 *     responses:
 *       200:
 *         description: Imagem encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Image'
 *       404:
 *         description: Imagem não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /vehicles/{id}/images/{imageId}:

 *   delete:

 *     summary: Exclui uma imagem de veículo

 *     tags: [Vehicles]

 *     security:

 *       - bearerAuth: []

 *     parameters:

 *       - in: path

 *         name: id

 *         schema:

 *           type: string

 *         required: true

 *         description: ID do veículo

 *       - in: path

 *         name: imageId

 *         schema:

 *           type: string

 *         required: true

 *         description: ID da imagem a ser excluída
 *     responses:
 *       200:
 *         description: Imagem excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Imagem excluída com sucesso
 *       404:
 *         description: Não Encontrado/Erro de Permissão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veículo não encontrado ou você não tem permissão para excluir imagens deste veículo
 *       500:
 *         description: Erro do Servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro do Servidor
 */