import { Request, Response } from 'express';
import Vehicle from '../models/Vehicle'; // Import the Mongoose Vehicle model
import { vehicleSchema } from '../schemas/vehicleSchema'; // Import vehicleSchema
import { z } from 'zod'; // Import zod for validation errors
import fs from 'fs';
import path from 'path';
import Image from '../models/Image'; // Import the Image model

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all available vehicles with pagination
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Items per page (default: 10)"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: ['createdAt', 'price', 'year', 'mileage']
 *         description: "Sort by field (default: 'createdAt')"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: ['asc', 'desc']
 *         description: "Sort order (default: 'desc' for createdAt, 'asc' for others)"
 *     responses:
 *       200:
 *         description: List of vehicles with pagination information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalVehicles:
 *                   type: integer
 *                   example: 42
 *                 firstImageUrl:
 *                   type: string
 *                   example: /uploads/vehicles/some_image.jpg
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getAllVehicles = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1; // Default to page 1
        const limit = parseInt(req.query.limit as string) || 10; // Default to 10 items per page
        const sortBy = req.query.sortBy as string || 'createdAt'; // Default sort by 'createdAt'
        const sortOrder = req.query.sortOrder as string || (sortBy === 'createdAt' ? 'desc' : 'asc'); // Default 'desc' for createdAt, 'asc' for others

        const skip = (page - 1) * limit;

        const sort: { [key: string]: 1 | -1 } = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const vehicles = await Vehicle.find()
            .select('-description -features -images') // Exclude description and features
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Manually get image URLs for firstImageUrl without populating the whole array
        const vehiclesWithFirstImage = await Promise.all(vehicles.map(async (vehicle: any) => {
            const firstImageDoc = await Image.findOne({ vehicle_id: vehicle._id }).select('imageUrl').lean();
            const firstImageUrl = firstImageDoc ? firstImageDoc.imageUrl : null;

            const vehicleObject = vehicle.toJSON();
            // The images array is not populated, so no need to delete it. It won't be there.
            return { ...vehicleObject, firstImageUrl };
        }));

        const totalVehicles = await Vehicle.countDocuments(); // Get total count for pagination

        res.status(200).json({
            vehicles: vehiclesWithFirstImage,
            currentPage: page,
            totalPages: Math.ceil(totalVehicles / limit),
            totalVehicles,
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * @swagger
 * /vehicles/search:
 *   get:
 *     summary: Search vehicles by multiple criteria with pagination
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search term for title, brand, model, color, year, state, or city
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Vehicle brand
 *       - in: query
 *         name: vehicleModel
 *         schema:
 *           type: string
 *         description: Vehicle model
 *       - in: query
 *         name: engine
 *         schema:
 *           type: string
 *         description: Vehicle engine
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Vehicle year
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: minYear
 *         schema:
 *           type: number
 *         description: Minimum year
 *       - in: query
 *         name: maxYear
 *         schema:
 *           type: number
 *         description: Maximum year
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Vehicle state
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Vehicle city
 *       - in: query
 *         name: fuel
 *         schema:
 *           type: string
 *         description: Vehicle fuel type
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *         description: Vehicle transmission type
 *       - in: query
 *         name: bodyType
 *         schema:
 *           type: string
 *         description: Vehicle body type
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Vehicle color
 *       - in: query
 *         name: minMileage
 *         schema:
 *           type: number
 *         description: Minimum mileage
 *       - in: query
 *         name: maxMileage
 *         schema:
 *           type: number
 *         description: Maximum mileage
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Items per page (default: 10)"
 *     responses:
 *       200:
 *         description: List of filtered vehicles with pagination information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalVehicles:
 *                   type: integer
 *                   example: 42
 *                 firstImageUrl:
 *                   type: string
 *                   example: /uploads/vehicles/some_image.jpg
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const searchVehicles = async (req: Request, res: Response) => {
    const { brand, vehicleModel, engine, year, minPrice, maxPrice, state, city, fuel, transmission, bodyType, color, mileage, name, minMileage, maxMileage, minYear, maxYear } = req.query; // Adicionei minMileage, maxMileage, minYear e maxYear

    const page = parseInt(req.query.page as string) || 1; // Default to page 1
    const limit = parseInt(req.query.limit as string) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;

    let filter: any = {};

    if (name) {
        const keywords = (name as string).split(' ').filter(Boolean); // Split by space and remove empty strings
        const keywordFilters = keywords.map(keyword => {
            const searchRegex = new RegExp(keyword, 'i');
            const yearSearch = parseInt(keyword);
            return {
                $or: [
                    { title: searchRegex },
                    { brand: searchRegex },
                    { vehicleModel: searchRegex },
                    { color: searchRegex },
                    { state: searchRegex },
                    { city: searchRegex },
                    ...(isNaN(yearSearch) ? [] : [{ year: yearSearch }]), // Add year search only if it's a valid number
                ]
            };
        });
        filter.$and = [...(filter.$and || []), ...keywordFilters];
    }
    if (brand) {
        filter.brand = { $regex: new RegExp(brand as string, 'i') };
    }
    if (vehicleModel) {
        filter.vehicleModel = { $regex: new RegExp(vehicleModel as string, 'i') };
    }
    if (engine) {
        filter.engine = { $regex: new RegExp(engine as string, 'i') };
    }

    // Validação para campos numéricos
    const parsedYear = parseInt(year as string);
    if (!isNaN(parsedYear)) {
        filter.year = parsedYear;
    }

    const parsedMinPrice = parseFloat(minPrice as string);
    if (!isNaN(parsedMinPrice)) {
        filter.price = { ...filter.price, $gte: parsedMinPrice };
    }

    const parsedMaxPrice = parseFloat(maxPrice as string);
    if (!isNaN(parsedMaxPrice)) {
        filter.price = { ...filter.price, $lte: parsedMaxPrice };
    }

    if (state) {
        filter.state = { $regex: new RegExp(state as string, 'i') };
    }
    if (city) {
        filter.city = { $regex: new RegExp(city as string, 'i') };
    }
    if (fuel) {
        filter.fuel = { $regex: new RegExp(fuel as string, 'i') };
    }
    if (transmission) {
        filter.transmission = { $regex: new RegExp(transmission as string, 'i') };
    }
    if (bodyType) {
        filter.bodyType = { $regex: new RegExp(bodyType as string, 'i') };
    }
    if (color) {
        filter.color = { $regex: new RegExp(color as string, 'i') };
    }

    const parsedMinMileage = parseInt(minMileage as string);
    if (!isNaN(parsedMinMileage)) {
        filter.mileage = { ...filter.mileage, $gte: parsedMinMileage };
    }

    const parsedMaxMileage = parseInt(maxMileage as string);
    if (!isNaN(parsedMaxMileage)) {
        filter.mileage = { ...filter.mileage, $lte: parsedMaxMileage };
    }

    const parsedMinYear = parseInt(minYear as string);
    if (!isNaN(parsedMinYear)) {
        filter.year = { ...filter.year, $gte: parsedMinYear };
    }

    const parsedMaxYear = parseInt(maxYear as string);
    if (!isNaN(parsedMaxYear)) {
        filter.year = { ...filter.year, $lte: parsedMaxYear };
    }

    try {
        const filteredVehicles = await Vehicle.find(filter)
            .select('-description -features -images') // Exclude description and features
            .skip(skip)
            .limit(limit);

        const vehiclesWithFirstImage = await Promise.all(filteredVehicles.map(async (vehicle: any) => {
            const firstImageDoc = await Image.findOne({ vehicle_id: vehicle._id }).select('imageUrl').lean();
            const firstImageUrl = firstImageDoc ? firstImageDoc.imageUrl : null;

            const vehicleObject = vehicle.toJSON();
            // The images array is not populated, so no need to delete it. It won't be there.
            return { ...vehicleObject, firstImageUrl };
        }));

        const totalVehicles = await Vehicle.countDocuments(filter);

        res.status(200).json({
            vehicles: vehiclesWithFirstImage,
            currentPage: page,
            totalPages: Math.ceil(totalVehicles / limit),
            totalVehicles,
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * @swagger
 * /vehicles/by-city-state:
 *   get:
 *     summary: Get vehicles by city and state
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         required: true
 *         description: City to search for vehicles
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: true
 *         description: State to search for vehicles
 *     responses:
 *       200:
 *         description: List of vehicles found for the city and state
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Missing Parameters Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Please provide a city and state to search
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error ao buscar veículos por cidade e estado
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
 *     summary: Publish a new vehicle for sale
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
 *               - title
 *               - brand
 *               - vehicleModel
 *               - engine
 *               - year
 *               - price
 *               - mileage
 *               - state
 *               - city
 *               - fuel
 *               - transmission
 *               - bodyType
 *               - color
 *               - description
 *               - announcerName
 *               - announcerEmail
 *               - announcerPhone
 *             properties:
 *               title:
 *                 type: string
 *                 example: Fusca 1970
 *               brand:
 *                 type: string
 *                 example: Volkswagen
 *               vehicleModel:
 *                 type: string
 *                 example: Fusca
 *               engine:
 *                 type: string
 *                 example: 1.5L
 *               year:
 *                 type: number
 *                 example: 1970
 *               price:
 *                 type: number
 *                 example: 15000
 *               mileage:
 *                 type: number
 *                 example: 50000
 *               state:
 *                 type: string
 *                 example: SP
 *               city:
 *                 type: string
 *                 example: São Paulo
 *               fuel:
 *                 type: string
 *                 example: Gasolina
 *               transmission:
 *                 type: string
 *                 example: Manual
 *               bodyType:
 *                 type: string
 *                 example: Hatch
 *               color:
 *                 type: string
 *                 example: Azul
 *               description:
 *                 type: string
 *                 example: Fusca em excelente estado de conservação.
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Ar condicionado", "Vidros elétricos"]
 *               announcerName:
 *                 type: string
 *                 example: João Silva
 *               announcerEmail:
 *                 type: string
 *                 format: email
 *                 example: joao.silva@example.com
 *               announcerPhone:
 *                 type: string
 *                 example: '+55 (11) 98765-4321'
 *     responses:
 *       201:
 *         description: Vehicle published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle published successfully
 *                 vehicle:
 *                   $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Invalid vehicle data or Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid vehicle data
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
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: User ID not found"
 *       500:
 *         description: Server error
 */
export const addVehicle = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized: User ID not found' });
        }
        const validatedData = vehicleSchema.parse(req.body);

        const { title, brand, vehicleModel, engine, year, price, mileage, state, city, fuel, transmission, bodyType, color, description, features, announcerName, announcerEmail, announcerPhone } = validatedData;

        const newVehicle = new Vehicle({
            owner_id: req.userId, // Obtained from authentication middleware
            title,
            brand,
            vehicleModel,
            engine,
            year,
            price,
            mileage,
            state,
            city,
            fuel,
            transmission,
            bodyType,
            color,
            description,
            features,
            announcerName,
            announcerEmail,
            announcerPhone,
        });

        const savedVehicle = await newVehicle.save();
        res.status(201).json(savedVehicle);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            const errors = err.issues.map(issue => ({
                path: issue.path,
                message: issue.message,
            }));
            return res.status(400).json({ message: 'Invalid vehicle data', errors });
        }
        console.error(err);
        res.status(500).json({ message: 'Error adding vehicle', error: err.message });
    }
};

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Update an existing vehicle's details
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Vehicle ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Fusca 1970
 *               brand:
 *                 type: string
 *                 example: Volkswagen
 *               vehicleModel:
 *                 type: string
 *                 example: Fusca
 *               engine:
 *                 type: string
 *                 example: 1.5L
 *               year:
 *                 type: number
 *                 example: 1970
 *               price:
 *                 type: number
 *                 example: 15000
 *               mileage:
 *                 type: number
 *                 example: 50000
 *               state:
 *                 type: string
 *                 example: SP
 *               city:
 *                 type: string
 *                 example: São Paulo
 *               fuel:
 *                 type: string
 *                 example: Gasolina
 *               transmission:
 *                 type: string
 *                 example: Manual
 *               bodyType:
 *                 type: string
 *                 example: Hatch
 *               color:
 *                 type: string
 *                 example: Azul
 *               description:
 *                 type: string
 *                 example: Fusca em excelente estado de conservação.
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Ar condicionado", "Vidros elétricos"]
 *               announcerName:
 *                 type: string
 *                 example: João Silva
 *               announcerEmail:
 *                 type: string
 *                 format: email
 *                 example: joao.silva@example.com
 *               announcerPhone:
 *                 type: string
 *                 example: '+55 (11) 98765-4321'
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
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
 *         description: Validation Error
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
 *                     properties:
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Vehicle not found or permission denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found or you do not have permission to edit this vehicle
 *       500:
 *         description: Server error
 */
export const updateVehicle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.userId; // Use req.userId as set by auth middleware

    try {
        // Validate request body with zod schema (partial for updates)
        const validatedData = vehicleSchema.partial().parse(req.body);

        const vehicle = await Vehicle.findOne({ _id: id, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to edit this vehicle' });
        }

        Object.assign(vehicle, validatedData);

        // Ensure numeric fields are correctly parsed if present in validatedData
        if (validatedData.year !== undefined) vehicle.year = validatedData.year;
        if (validatedData.price !== undefined) vehicle.price = validatedData.price;
        if (validatedData.mileage !== undefined) vehicle.mileage = validatedData.mileage;

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
 * /vehicles/{id}/images:
 *   post:
 *     summary: Upload vehicle images
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Vehicle ID to upload images for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *                 description: Up to 10 image files (jpeg, jpg, png, gif)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Images uploaded successfully
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["/uploads/vehicles/image1.jpg", "/uploads/vehicles/image2.png"]
 *       400:
 *         description: No Files Provided or Invalid File Type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No image files provided
 *       404:
 *         description: Vehicle not found or permission denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found or you do not have permission to upload images for this vehicle
 *       500:
 *         description: Server Error
 */
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

        const imageUrls = (req.files as Express.Multer.File[]).map(file => `/uploads/vehicles/${file.filename}`);

        // Enforce the 10-image limit
        if ((vehicle.images?.length || 0) + imageUrls.length > 10) {
            // Clean up newly uploaded files if the limit is exceeded
            imageUrls.forEach(url => {
                const filePath = path.join(__dirname, '../../uploads/vehicles', path.basename(url));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            return res.status(400).json({ message: `Cannot upload more than 10 images. You already have ${vehicle.images?.length || 0} images.` });
        }

        // Add new image URLs to the vehicle's images array
        vehicle.images = [...(vehicle.images || []), ...imageUrls];
        await vehicle.save();

        res.status(200).json({ message: 'Images uploaded successfully', images: imageUrls });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error uploading images', error: err.message });
    }
};

/**
 * @swagger
 * /vehicles/{id}/images/{imageName}:
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
 *         name: imageName
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the image file to delete
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
 */
export const deleteImage = async (req: Request, res: Response) => {
    try {
        const { id, imageName } = req.params;
        const ownerId = req.userId; // Use req.userId as set by auth middleware

        // Verify vehicle exists and belongs to the user
        const vehicle = await Vehicle.findOne({ _id: id, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to delete images for this vehicle' });
        }

        // Delete the file from the filesystem
        const imagePath = path.join(__dirname, '../../uploads/vehicles', imageName);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        } else {
            return res.status(404).json({ message: 'Image not found on filesystem' });
        }

        // Remove the image URL from the vehicle's images array
        if (vehicle.images) {
            vehicle.images = vehicle.images.filter(img => path.basename(img) !== imageName);
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
 * /vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Vehicle ID to delete
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Not Found/Permission Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found or you do not have permission to delete this vehicle
 *       500:
 *         description: Server error
 */
export const deleteVehicle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.userId; // Use req.userId as set by auth middleware

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

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get a vehicle by ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the vehicle to retrieve
 *     responses:
 *       200:
 *         description: Vehicle found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
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
export const getVehicleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id).populate({ path: 'images', select: 'imageUrl' });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const vehicleObject = vehicle.toJSON();
        delete vehicleObject.images; // Remove the images array

        res.status(200).json(vehicleObject);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching vehicle', error: err.message });
    }
};
