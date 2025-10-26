import { Router } from 'express';
import { getImagesByVehicleId } from '../controllers/imageController';

const router = Router();

// Public route to get images for a specific vehicle
router.get('/:vehicleId', getImagesByVehicleId);

export default router;
