import { Router } from 'express';
import {
    getAllCars,
    searchCars,
    publishVehicle,
    updateVehicle,
    deleteVehicle,
    getCarsByLocation
} from '../controllers/carController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', getAllCars);
router.get('/search', searchCars);
router.get('/by-location', getCarsByLocation);

// Authenticated routes
router.post('/', authenticateUser, publishVehicle);
router.put('/:id', authenticateUser, updateVehicle);
router.delete('/:id', authenticateUser, deleteVehicle);

export default router;
