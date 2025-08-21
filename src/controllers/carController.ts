import { Request, Response } from 'express';
import Car from '../models/Car'; // Import the Mongoose Car model
import { carSchema } from '../schemas/carSchema'; // Import carSchema
import { z } from 'zod'; // Import zod for validation errors

/**
 * @swagger
 * /cars:
 *   get:
 *     summary: Retorna todos os carros disponíveis
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: Lista de carros obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Car'
 *       500:
 *         description: Erro do servidor
 */
export const getAllCars = async (req: Request, res: Response) => {
    try {
        const cars = await Car.find();
        res.status(200).json(cars);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @swagger
 * /cars/search:
 *   get:
 *     summary: Busca carros com base em múltiplos critérios
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: make
 *         schema:
 *           type: string
 *         description: Marca do carro
 *         example: Toyota
 *       - in: query
 *         name: carModel
 *         schema:
 *           type: string
 *         description: Modelo do carro
 *         example: Corolla
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Ano do carro
 *         example: 2020
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *         example: 10000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Preço máximo
 *         example: 50000
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Localização do carro
 *         example: São Paulo
 *       - in: query
 *         name: engineType
 *         schema:
 *           type: string
 *         description: Tipo de motor
 *         example: V6
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *         description: Tipo de veículo
 *         example: Sedan
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *         description: Tipo de combustível
 *         example: Gasolina
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *         description: Tipo de transmissão
 *         example: Automatico
 *       - in: query
 *         name: mileage
 *         schema:
 *           type: number
 *         description: Quilometragem
 *         example: 50000
 *     responses:
 *       200:
 *         description: Carros filtrados obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Car'
 *       500:
 *         description: Erro do servidor
 */
export const searchCars = async (req: Request, res: Response) => {
    const { make, carModel, year, minPrice, maxPrice, location, engineType, vehicleType, fuelType, transmission, mileage } = req.query;
    let filter: any = {};

    if (make) {
        filter.make = { $regex: new RegExp(make as string, 'i') }; // Case-insensitive search
    }
    if (carModel) {
        filter.carModel = { $regex: new RegExp(carModel as string, 'i') }; // Case-insensitive search
    }
    if (year) {
        filter.year = parseInt(year as string);
    }
    if (minPrice) {
        filter.price = { ...filter.price, $gte: parseFloat(minPrice as string) };
    }
    if (maxPrice) {
        filter.price = { ...filter.price, $lte: parseFloat(maxPrice as string) };
    }
    if (location) {
        filter.location = { $regex: new RegExp(location as string, 'i') };
    }
    if (engineType) {
        filter.engineType = { $regex: new RegExp(engineType as string, 'i') };
    }
    if (vehicleType) {
        filter.vehicleType = { $regex: new RegExp(vehicleType as string, 'i') };
    }
    if (fuelType) {
        filter.fuelType = { $regex: new RegExp(fuelType as string, 'i') };
    }
    if (transmission) {
        filter.transmission = { $regex: new RegExp(transmission as string, 'i') };
    }
    if (mileage) {
        filter.mileage = parseInt(mileage as string);
    }

    try {
        const filteredCars = await Car.find(filter);
        res.status(200).json(filteredCars);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @swagger
 * /cars/by-location:
 *   get:
 *     summary: Retorna carros por localização
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         required: true
 *         description: Localização para buscar carros
 *         example: São Paulo
 *     responses:
 *       200:
 *         description: Carros encontrados para a localização
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Car'
 *       400:
 *         description: Parâmetro de localização ausente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Please provide a location to search
 *       500:
 *         description: Erro do servidor
 */
export const getCarsByLocation = async (req: Request, res: Response) => {
    const { location } = req.query;

    if (!location) {
        return res.status(400).json({ message: 'Please provide a location to search' });
    }

    try {
        const cars = await Car.find({ location: { $regex: new RegExp(location as string, 'i') } });
        res.status(200).json(cars);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @swagger
 * /cars:
 *   post:
 *     summary: Publica um novo veículo para venda
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CarInput'
 *     responses:
 *       201:
 *         description: Veículo publicado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle published successfully
 *                 car:
 *                   $ref: '#/components/schemas/Car'
 *       400:
 *         description: Erro de validação ou campos ausentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Validation Error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Não autorizado (token ausente ou inválido)
 *       500:
 *         description: Erro do servidor
 */
export const publishVehicle = async (req: Request, res: Response) => {
    const { make, carModel, year, price, description, location, engineType, vehicleType, fuelType, transmission, mileage } = req.body;
    const ownerId = (req as any).user.id;

    try {
        // Validate request body with zod schema
        const validatedData = carSchema.parse(req.body);

        const newCar = new Car({
            owner_id: ownerId,
            ...validatedData, // Use validated data
            year: parseInt(validatedData.year as any), // Ensure year is number
            price: validatedData.price ? parseFloat(validatedData.price as any) : null, // Ensure price is number or null
            mileage: validatedData.mileage ? parseInt(validatedData.mileage as any) : null // Ensure mileage is number or null
        });

        await newCar.save();

        res.status(201).json({ message: 'Vehicle published successfully', car: newCar });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: err.issues });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @swagger
 * /cars/{id}:
 *   put:
 *     summary: Atualiza os detalhes de um veículo existente
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo a ser atualizado
 *         example: seu-guid-do-carro-aqui
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CarInputPartial'
 *     responses:
 *       200:
 *         description: Veículo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle updated successfully
 *                 car:
 *                   $ref: '#/components/schemas/Car'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Validation Error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Não autorizado (token ausente ou inválido)
 *       404:
 *         description: Veículo não encontrado ou sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found or you do not have permission to edit this vehicle
 *       500:
 *         description: Erro do servidor
 */
export const updateVehicle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = (req as any).user.id;

    try {
        // Validate request body with zod schema (partial for updates)
        const validatedData = carSchema.partial().parse(req.body);

        const car = await Car.findOne({ _id: id, owner_id: ownerId });

        if (!car) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to edit this vehicle' });
        }

        Object.assign(car, validatedData);

        // Ensure numeric fields are correctly parsed if present in validatedData
        if (validatedData.year !== undefined) car.year = parseInt(validatedData.year as any);
        if (validatedData.price !== undefined) car.price = validatedData.price ? parseFloat(validatedData.price as any) : null;
        if (validatedData.mileage !== undefined) car.mileage = validatedData.mileage ? parseInt(validatedData.mileage as any) : null;

        await car.save();

        res.status(200).json({ message: 'Vehicle updated successfully', car });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: err.issues });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @swagger
 * /cars/{id}:
 *   delete:
 *     summary: Deleta um veículo
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo a ser deletado
 *         example: seu-guid-do-carro-aqui
 *     responses:
 *       200:
 *         description: Veículo deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle deleted successfully
 *       401:
 *         description: Não autorizado (token ausente ou inválido)
 *       404:
 *         description: Veículo não encontrado ou sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found or you do not have permission to delete this vehicle
 *       500:
 *         description: Erro do servidor
 */
export const deleteVehicle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = (req as any).user.id;

    try {
        const result = await Car.deleteOne({ _id: id, owner_id: ownerId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to delete this vehicle' });
        }

        res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
