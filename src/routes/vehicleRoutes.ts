import express, { Router } from 'express';
import {
    getAllVehicles,
    searchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehiclesByCityAndState,
    getVehicleById,
    getUserVehicles,
} from '../controllers/vehicleController';
import { uploadImages, deleteImage } from '../controllers/imageController';
import { authenticateUser } from '../middleware/authMiddleware';
import { uploadVehicleImages } from '../middleware/uploadMiddleware';

const router = Router();

// Public routes
router.get('/', getAllVehicles);
router.get('/search', searchVehicles);
router.get('/by-city-state', getVehiclesByCityAndState);
router.get('/:id', getVehicleById);

// Authenticated routes
router.get('/:id/my-vehicles', authenticateUser, getUserVehicles);
router.post('/', authenticateUser, express.json(), addVehicle);
router.put('/:id', authenticateUser, express.json(), updateVehicle);
router.delete('/:id', authenticateUser, deleteVehicle);

// Image routes
router.post('/:id/images', authenticateUser, uploadVehicleImages, uploadImages);
router.delete('/:id/images/:imageId', authenticateUser, deleteImage);

export default router;
