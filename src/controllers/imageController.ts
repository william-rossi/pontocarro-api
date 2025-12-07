import { Request, Response } from 'express';
import Image from '../models/Image';
import Vehicle from '../models/Vehicle';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp'; // Import sharp for image processing
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames

export const uploadImages = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }

        const vehicleId = req.params.id;
        const ownerId = req.userId; // Use req.userId as set by auth middleware

        // Verify vehicle exists and belongs to the user
        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to upload images for this vehicle' });
        }

        const newImageFiles = req.files as Express.Multer.File[];

        // Check total images limit (existing + new)
        const existingImagesCount = await Image.countDocuments({ vehicle_id: vehicleId });
        if (existingImagesCount + newImageFiles.length > 10) {
            return res.status(400).json({ message: `Cannot upload more than 10 images. You already have ${existingImagesCount} images.` });
        }

        const imageUrls: string[] = [];
        const imageIds: string[] = [];

        for (const file of newImageFiles) {
            const uniqueFilename = `${uuidv4()}.webp`; // Use WebP for better compression
            const outputPath = path.join(__dirname, '../../uploads/vehicles', uniqueFilename);

            await sharp(file.buffer)
                .resize(1920, undefined, { // Resize to max 1920px width, auto height
                    withoutEnlargement: true // Don't enlarge images smaller than 1920px
                })
                .webp({ quality: 80 }) // Compress to WebP with 80% quality
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

        // Add new image IDs to the vehicle's images array
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
 *     summary: Get all images for a specific vehicle
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the vehicle to retrieve images for
 *     responses:
 *       200:
 *         description: List of images for the vehicle
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Image'
 *       404:
 *         description: No images found for this vehicle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
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
 *     summary: Get the first image for a specific vehicle
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the vehicle to retrieve the first image for
 *     responses:
 *       200:
 *         description: First image found for the vehicle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Image'
 *       404:
 *         description: No images found for this vehicle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getFirstImageByVehicleId = async (req: Request, res: Response) => {
    try {
        const { vehicleId } = req.params;
        const image = await Image.findOne({ vehicle_id: vehicleId }).sort({ created_at: 1 }); // Get the first image by creation date

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
 *     summary: Get a specific image by its ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the image to retrieve
 *     responses:
 *       200:
 *         description: Image found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Image'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
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
        const { id, imageId } = req.params; // id is vehicleId, imageId is the image _id
        const ownerId = req.userId; // User ID from authentication middleware

        // Verify vehicle exists and belongs to the user
        const vehicle = await Vehicle.findOne({ _id: id, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to delete images for this vehicle' });
        }

        // Find the image to delete
        const imageToDelete = await Image.findOne({ _id: imageId, vehicle_id: id });

        if (!imageToDelete) {
            return res.status(404).json({ message: 'Image not found for this vehicle.' });
        }

        // Delete the file from the filesystem
        const filename = path.basename(imageToDelete.imageUrl);
        const filePath = path.join(__dirname, '../../uploads/vehicles', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            console.warn(`File not found on filesystem but present in DB: ${filePath}`);
        }

        // Remove the image from the database
        await Image.deleteOne({ _id: imageId });

        // Remove the image ID from the vehicle's images array
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
 *     summary: Delete a vehicle image
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Vehicle ID
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image deleted successfully
 *       404:
 *         description: Not Found/Permission Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found or you do not have permission to delete images for this vehicle
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server Error
 */