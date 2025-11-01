import { Router } from 'express';
import { getImagesByVehicleId, getFirstImageByVehicleId, getImageById } from '../controllers/imageController';

const router = Router();

// Public route to get images for a specific vehicle
router.get('/:vehicleId', getImagesByVehicleId);

// Public route to get the first image for a specific vehicle
router.get('/:vehicleId/first', getFirstImageByVehicleId);

// Public route to get a specific image by its ID
router.get('/image/:imageId', getImageById);

export default router;
