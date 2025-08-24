import { Router } from 'express';
import {
    getAllVehicles,
    searchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehiclesByCityAndState
} from '../controllers/vehicleController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', getAllVehicles);
router.get('/search', searchVehicles);
router.get('/by-city-state', getVehiclesByCityAndState);

// Authenticated routes
router.post('/', authenticateUser, addVehicle);
router.put('/:id', authenticateUser, updateVehicle);
router.delete('/:id', authenticateUser, deleteVehicle);

export default router;
