import { Request, Response } from 'express';
import Vehicle from '../models/Vehicle'; // Import the Mongoose Vehicle model
import { vehicleSchema } from '../schemas/vehicleSchema'; // Import vehicleSchema
import { z } from 'zod'; // Import zod for validation errors

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Retorna todos os veículos disponíveis
 *     tags: [Vehicles]
 *     responses:
 *       200:
 *         description: Lista de veículos obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       500:
 *         description: Erro do servidor
 */
export const getAllVehicles = async (req: Request, res: Response) => {
    try {
        const vehicles = await Vehicle.find();
        res.status(200).json(vehicles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @swagger
 * /vehicles/search:
 *   get:
 *     summary: Busca veículos com base em múltiplos critérios
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: make
 *         schema:
 *           type: string
 *         description: Marca do veículo
 *         example: Toyota
 *       - in: query
 *         name: vehicleModel
 *         schema:
 *           type: string
 *         description: Modelo do veículo
 *         example: Corolla
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Ano do veículo
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
 *         name: city
 *         schema:
 *           type: string
 *         description: Localização do veículo
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
 *         description: Veículos filtrados obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       500:
 *         description: Erro do servidor
 */
export const searchVehicles = async (req: Request, res: Response) => {
    const { make, vehicleModel, year, minPrice, maxPrice, city, state, engineType, vehicleType, fuelType, transmission, mileage } = req.query;
    let filter: any = {};

    if (make) {
        filter.make = { $regex: new RegExp(make as string, 'i') }; // Case-insensitive search
    }
    if (vehicleModel) {
        filter.vehicleModel = { $regex: new RegExp(vehicleModel as string, 'i') }; // Case-insensitive search
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
    if (city) {
        filter.city = { $regex: new RegExp(city as string, 'i') };
    }
    if (state) {
        filter.state = { $regex: new RegExp(state as string, 'i') };
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
        const filteredVehicles = await Vehicle.find(filter);
        res.status(200).json(filteredVehicles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @swagger
 * /vehicles/by-city-state:
 *   get:
 *     summary: Retorna veículos por cidade e estado
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         required: true
 *         description: Cidade para buscar veículos
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: true
 *         description: Estado para buscar veículos
 *     responses:
 *       200:
 *         description: Veículos encontrados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Parâmetros de busca inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Por favor, forneça cidade e estado para buscar
 *       500:
 *         description: Erro do servidor
 */
export const getVehiclesByCityAndState = async (req: Request, res: Response) => {
    try {
        const { city, state } = req.query;

        if (!city || !state) {
            return res.status(400).json({ message: 'Please provide a city and state to search' });
        }

        const vehicles = await Vehicle.find({ city: { $regex: new RegExp(city as string, 'i') }, state: { $regex: new RegExp(state as string, 'i') } });
        res.status(200).json(vehicles);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar veículos por cidade e estado', error: err.message });
    }
};

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Adiciona um novo veículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - vehicleModel
 *               - year
 *               - city
 *               - state
 *             properties:
 *               owner_id:
 *                 type: string
 *                 description: ID do proprietário do veículo (gerado automaticamente se não fornecido)
 *                 example: 652a92e107c1b5a6a3e1a9e1
 *               make:
 *                 type: string
 *                 description: Marca do veículo
 *                 example: Toyota
 *               vehicleModel:
 *                 type: string
 *                 description: Modelo do veículo
 *                 example: Corolla
 *               year:
 *                 type: number
 *                 description: Ano de fabricação
 *                 example: 2020
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Preço do veículo
 *                 example: 75000.00
 *               description:
 *                 type: string
 *                 description: Descrição do veículo
 *                 example: Veículo em excelente estado, único dono.
 *               city:
 *                 type: string
 *                 description: Cidade onde o veículo está localizado
 *                 example: São Paulo
 *               state:
 *                 type: string
 *                 description: Estado onde o veículo está localizado
 *                 example: SP
 *               engineType:
 *                 type: string
 *                 description: Tipo de motor (ex: Gasolina, Flex, Elétrico)
 *                 example: Flex
 *               vehicleType:
 *                 type: string
 *                 description: Tipo de veículo (ex: Sedan, SUV, Hatch)
 *                 example: Sedan
 *               fuelType:
 *                 type: string
 *                 description: Tipo de combustível (ex: Gasolina, Etanol, Diesel)
 *                 example: Gasolina
 *               transmission:
 *                 type: string
 *                 description: Tipo de transmissão (ex: Automática, Manual)
 *                 example: Automática
 *               mileage:
 *                 type: number
 *                 format: int
 *                 description: Quilometragem do veículo
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Veículo adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dados inválidos para o veículo
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token de autenticação não fornecido ou inválido
 *       500:
 *         description: Erro do servidor
 */
export const addVehicle = async (req: Request, res: Response) => {
    try {
        const validatedData = vehicleSchema.parse(req.body);

        const { make, vehicleModel, year, price, description, city, state, engineType, vehicleType, fuelType, transmission, mileage } = validatedData;

        const newVehicle = new Vehicle({
            owner_id: req.userId, // Obtido do middleware de autenticação
            make,
            vehicleModel,
            year,
            price,
            description,
            city,
            state,
            engineType,
            vehicleType,
            fuelType,
            transmission,
            mileage,
        });

        const savedVehicle = await newVehicle.save();
        res.status(201).json(savedVehicle);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid vehicle data', errors: err.issues });
        }
        console.error(err);
        res.status(500).json({ message: 'Error adding vehicle', error: err.message });
    }
};

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Atualiza os detalhes de um veículo existente
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo a ser atualizado
 *         example: seu-guid-do-veículo-aqui
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInputPartial'
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
 *                 vehicle:
 *                   $ref: '#/components/schemas/Vehicle'
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
        const validatedData = vehicleSchema.partial().parse(req.body);

        const vehicle = await Vehicle.findOne({ _id: id, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to edit this vehicle' });
        }

        Object.assign(vehicle, validatedData);

        // Ensure numeric fields are correctly parsed if present in validatedData
        if (validatedData.year !== undefined) vehicle.year = parseInt(validatedData.year as any);
        if (validatedData.price !== undefined) vehicle.price = validatedData.price ? parseFloat(validatedData.price as any) : null;
        if (validatedData.mileage !== undefined) vehicle.mileage = validatedData.mileage ? parseInt(validatedData.mileage as any) : null;

        await vehicle.save();

        res.status(200).json({ message: 'Vehicle updated successfully', vehicle });
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
 * /vehicles/{id}:
 *   delete:
 *     summary: Deleta um veículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo a ser deletado
 *         example: seu-guid-do-veículo-aqui
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
        const result = await Vehicle.deleteOne({ _id: id, owner_id: ownerId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to delete this vehicle' });
        }

        res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
