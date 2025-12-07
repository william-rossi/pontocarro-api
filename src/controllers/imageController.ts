import { Request, Response } from 'express';
import Image from '../models/Image';
import Vehicle from '../models/Vehicle';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp'; // Importa sharp para processamento de imagem
import { v4 as uuidv4 } from 'uuid'; // Para gerar nomes de arquivo únicos

export const uploadImages = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }

        const vehicleId = req.params.id;
        const ownerId = req.userId; // Usa req.userId conforme definido pelo middleware de autenticação

        // Verifica se o veículo existe e pertence ao usuário
        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to upload images for this vehicle' });
        }

        const newImageFiles = req.files as Express.Multer.File[];

        // Verifica o limite total de imagens (existentes + novas)
        const existingImagesCount = await Image.countDocuments({ vehicle_id: vehicleId });
        if (existingImagesCount + newImageFiles.length > 10) {
            return res.status(400).json({ message: `Cannot upload more than 10 images. You already have ${existingImagesCount} images.` });
        }

        const imageUrls: string[] = [];
        const imageIds: string[] = [];

        for (const file of newImageFiles) {
            const uniqueFilename = `${uuidv4()}.webp`; // Usa WebP para melhor compressão
            const outputPath = path.join(__dirname, '../../uploads/vehicles', uniqueFilename);

            await sharp(file.buffer)
                .resize(1920, undefined, { // Redimensiona para largura máxima de 1920px, altura automática
                    withoutEnlargement: true // Não amplia imagens menores que 1920px
                })
                .webp({ quality: 80 }) // Comprime para WebP com qualidade de 80%
                .toFile(outputPath);

            const imageUrl = `/uploads/vehicles/${uniqueFilename}`;
            const newImage = new Image({
                vehicle_id: vehicleId,
                imageUrl: imageUrl,
            });
            const savedImage = await newImage.save();
            imageUrls.push(imageUrl);
            imageIds.push(savedImage._id.toString());
        }

        // Adiciona novos IDs de imagem ao array de imagens do veículo
        vehicle.images = [...(vehicle.images || []), ...imageIds];
        await vehicle.save();

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

        res.status(200).json(images);
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

        res.status(200).json(image);
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

        res.status(200).json(image);
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

        // Exclui o arquivo do sistema de arquivos
        const filename = path.basename(imageToDelete.imageUrl);
        const filePath = path.join(__dirname, '../../uploads/vehicles', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            console.warn(`Arquivo não encontrado no sistema de arquivos, mas presente no DB: ${filePath}`);
        }

        // Remove a imagem do banco de dados
        await Image.deleteOne({ _id: imageId });

        // Remove o ID da imagem do array de imagens do veículo
        if (vehicle.images) {
            vehicle.images = vehicle.images.filter(img => img.toString() !== imageId);
            await vehicle.save();
        }

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