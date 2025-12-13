import { Request, Response } from 'express';
import Vehicle from '../models/Vehicle';
import { vehicleSchema } from '../schemas/vehicleSchema';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import Image from '../models/Image';
import cloudinary from '../config/cloudinary';

const cleanCloudinaryUrl = (url: string, originalPublicId?: string) => {
    // Se temos o originalPublicId, construímos a URL correta diretamente
    if (originalPublicId && originalPublicId.includes('vehicles/')) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dw5xqqlvl';
        // Garante que o publicId tenha extensão .webp (todas as imagens são convertidas para webp)
        let finalPublicId = originalPublicId;
        if (!/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(finalPublicId)) {
            finalPublicId += '.webp';
        } else if (!finalPublicId.endsWith('.webp')) {
            // Se tem extensão mas não é webp, substitui por webp
            finalPublicId = finalPublicId.replace(/\.(jpg|jpeg|png|gif|svg)$/i, '.webp');
        }
        return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${finalPublicId}`;
    }

    // Fallback para URLs antigas que podem precisar de correção
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        return url; // Não é uma URL web, retorna como está
    }

    try {
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.delete('_a');
        parsedUrl.protocol = 'https:';

        // Remove o segmento '/v1/' ou outras versões se existir
        parsedUrl.pathname = parsedUrl.pathname.replace(/\/v\d+\//, '/');

        let finalUrl = parsedUrl.toString();

        // Adiciona .jpg se não tiver extensão e se for uma URL do Cloudinary
        if (finalUrl.includes('res.cloudinary.com') && !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(finalUrl)) {
            finalUrl += '.jpg';
        }

        return finalUrl;
    } catch (error) {
        console.warn('Falha ao limpar URL do Cloudinary:', url, error);
        return url; // Em caso de erro na URL, retorna a original
    }
};

// Função auxiliar para remover acentos de uma string
const stripAccents = (str: string): string => {
    return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
};

export const getAllVehicles = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1; // Padrão para página 1
        const limit = parseInt(req.query.limit as string) || 10; // Padrão para 10 itens por página
        let sortBy = req.query.sortBy as string || 'created_at'; // Padrão de ordenação por 'created_at'
        const sortOrder = req.query.sortOrder as string || (sortBy === 'created_at' ? 'desc' : 'asc'); // Padrão 'desc' para created_at, 'asc' para outros

        // Mapeia 'createdAt' para 'created_at' para a consulta ao banco de dados
        if (sortBy === 'createdAt') {
            sortBy = 'created_at';
        }

        const skip = (page - 1) * limit;

        const sort: { [key: string]: 1 | -1 } = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const vehicles = await Vehicle.find()
            .select('-description -features -images') // Exclui descrição e features
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Obtém manualmente as URLs das imagens para firstImageUrl sem popular o array inteiro
        const vehiclesWithFirstImage = await Promise.all(vehicles.map(async (vehicle: any) => {
            const firstImageDoc = await Image.findOne({ vehicle_id: vehicle._id }).select('imageUrl cloudinaryPublicId').lean();
            const firstImageUrl = firstImageDoc ? cleanCloudinaryUrl(firstImageDoc.imageUrl, firstImageDoc.cloudinaryPublicId) : null;

            const vehicleObject = vehicle.toJSON();
            // O array de imagens não é populado, então não há necessidade de excluí-lo. Ele não estará lá.
            return { ...vehicleObject, firstImageUrl };
        }));

        const totalVehicles = await Vehicle.countDocuments(); // Obtém a contagem total para paginação

        res.status(200).json({
            vehicles: vehiclesWithFirstImage,
            currentPage: page,
            totalPages: Math.ceil(totalVehicles / limit),
            totalVehicles,
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor', error: err.message });
    }
};

export const getUserVehicles = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'Não autorizado: ID do usuário não encontrado' });
        }

        const { id } = req.params; // Obtém o ID do usuário dos parâmetros da URL

        if (id !== req.userId) {
            return res.status(403).json({ message: 'Proibido: Você só pode visualizar seus próprios veículos.' });
        }

        const page = parseInt(req.query.page as string) || 1; // Padrão para página 1
        const limit = parseInt(req.query.limit as string) || 10; // Padrão para 10 itens por página
        let sortBy = req.query.sortBy as string || 'created_at'; // Padrão de ordenação por 'created_at'

        if (sortBy === 'createdAt') {
            sortBy = 'created_at';
        }

        const sortOrder = req.query.sortOrder as string || (sortBy === 'created_at' ? 'desc' : 'asc'); // Padrão 'desc' para created_at, 'asc' para outros

        const skip = (page - 1) * limit;

        const sort: { [key: string]: 1 | -1 } = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const vehicles = await Vehicle.find({ owner_id: req.userId })
            .select('-description -features -images') // Exclui descrição, features e imagens
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalVehicles = await Vehicle.countDocuments({ owner_id: req.userId }); // Obtém a contagem total para paginação
        const totalPages = Math.ceil(totalVehicles / limit);

        // Anexa firstImageUrl a cada veículo
        const vehiclesWithFirstImage = await Promise.all(vehicles.map(async (vehicle: any) => {
            const firstImage = await Image.findOne({ vehicle_id: vehicle._id }).select('imageUrl cloudinaryPublicId').lean();
            const plainVehicle = vehicle._doc ? { ...vehicle._doc } : { ...vehicle };
            return { ...plainVehicle, firstImageUrl: firstImage ? cleanCloudinaryUrl(firstImage.imageUrl, firstImage.cloudinaryPublicId) : null };
        }));

        res.status(200).json({
            vehicles: vehiclesWithFirstImage,
            currentPage: page,
            totalPages: totalPages,
            totalVehicles: totalVehicles,
        });
    } catch (error) {
        console.error('Erro ao buscar veículos do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const searchVehicles = async (req: Request, res: Response) => {
    const { brand, vehicleModel, engine, year, minPrice, maxPrice, state, city, fuel, transmission, bodyType, color, mileage, name, minMileage, maxMileage, minYear, maxYear } = req.query; // Adicionei minMileage, maxMileage, minYear e maxYear

    const page = parseInt(req.query.page as string) || 1; // Padrão para página 1
    const limit = parseInt(req.query.limit as string) || 10; // Padrão para 10 itens por página
    const sortBy = req.query.sortBy as string || 'created_at'; // Padrão de ordenação por 'created_at'
    const sortOrder = req.query.sortOrder as string || (sortBy === 'created_at' ? 'desc' : 'asc'); // Padrão 'desc' para created_at, 'asc' para outros
    const skip = (page - 1) * limit;

    let filter: any = {};

    if (name) {
        const keywords = (name as string).split(' ').filter(Boolean); // Divide por espaço e remove strings vazias
        const keywordFilters = keywords.map(keyword => {
            const strippedKeyword = stripAccents(keyword); // Remove acentos da palavra-chave
            const searchRegex = new RegExp(strippedKeyword, 'i');
            const yearSearch = parseInt(keyword);
            return {
                $or: [
                    { title: searchRegex },
                    { brand: searchRegex },
                    { vehicleModel: searchRegex },
                    { color: searchRegex },
                    { state: searchRegex },
                    { city: searchRegex },
                    ...(isNaN(yearSearch) ? [] : [{ year: yearSearch }]), // Adiciona busca por ano apenas se for um número válido
                ]
            };
        });
        filter.$and = [...(filter.$and || []), ...keywordFilters];
    }
    if (brand) {
        filter.brand = { $regex: new RegExp(stripAccents(brand as string), 'i') }; // Aplica stripAccents ao filtro de marca
    }
    if (vehicleModel) {
        filter.vehicleModel = { $regex: new RegExp(stripAccents(vehicleModel as string), 'i') }; // Aplica stripAccents ao filtro de modelo de veículo
    }
    if (engine) {
        filter.engine = { $regex: new RegExp(stripAccents(engine as string), 'i') }; // Aplica stripAccents ao filtro de motorização
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
        filter.color = { $regex: new RegExp(stripAccents(color as string), 'i') }; // Aplica stripAccents ao filtro de cor
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

    const sort: { [key: string]: 1 | -1 } = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    try {
        const filteredVehicles = await Vehicle.find(filter)
            .select('-description -features -images') // Exclui descrição e features
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const vehiclesWithFirstImage = await Promise.all(filteredVehicles.map(async (vehicle: any) => {
            const firstImageDoc = await Image.findOne({ vehicle_id: vehicle._id }).select('imageUrl cloudinaryPublicId').lean();
            const firstImageUrl = firstImageDoc ? cleanCloudinaryUrl(firstImageDoc.imageUrl, firstImageDoc.cloudinaryPublicId) : null;

            const vehicleObject = vehicle.toJSON();
            // O array de imagens não é populado, então não há necessidade de excluí-lo. Ele não estará lá.
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
        res.status(500).json({ message: 'Erro do servidor', error: err.message });
    }
};

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

export const addVehicle = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized: User ID not found' });
        }
        const validatedData = vehicleSchema.parse(req.body);

        const { title, brand, vehicleModel, engine, year, price, mileage, state, city, fuel, transmission, bodyType, color, description, features, announcerName, announcerEmail, announcerPhone } = validatedData;

        const newVehicle = new Vehicle({
            owner_id: req.userId, // Revertido para usar req.userId diretamente
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

export const updateVehicle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.userId; // Usa req.userId conforme definido pelo middleware de autenticação

    try {
        // Valida o corpo da requisição com o esquema zod (parcial para atualizações)
        const validatedData = vehicleSchema.partial().parse(req.body);

        const vehicle = await Vehicle.findOne({ _id: id, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to edit this vehicle' });
        }

        Object.assign(vehicle, validatedData);

        // Garante que os campos numéricos sejam analisados corretamente se presentes em validatedData
        if (validatedData.year !== undefined) vehicle.year = validatedData.year;
        if (validatedData.price !== undefined) vehicle.price = validatedData.price;
        if (validatedData.mileage !== undefined) vehicle.mileage = validatedData.mileage;

        await vehicle.save();

        res.status(200).json({ message: 'Veículo atualizado com sucesso', vehicle });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Erro de Validação', errors: err.issues });
        }
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor' });
    }
};

export const deleteImage = async (req: Request, res: Response) => {
    try {
        const { id, imageName } = req.params;
        const ownerId = req.userId; // Usa req.userId conforme definido pelo middleware de autenticação

        // Verifica se o veículo existe e pertence ao usuário
        const vehicle = await Vehicle.findOne({ _id: id, owner_id: ownerId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to delete images for this vehicle' });
        }

        // Exclui o arquivo do sistema de arquivos
        const imagePath = path.join(__dirname, '../../uploads/vehicles', imageName);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        } else {
            return res.status(404).json({ message: 'Image not found on filesystem' });
        }

        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting image', error: err.message });
    }
};

export const deleteVehicle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.userId; // Usa req.userId conforme definido pelo middleware de autenticação

    try {
        // Encontra o veículo para garantir que ele exista e pertença ao usuário
        const vehicleToDelete = await Vehicle.findOne({ _id: id, owner_id: ownerId });

        if (!vehicleToDelete) {
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to delete this vehicle' });
        }

        // 1. Exclui todas as imagens da pasta do veículo no Cloudinary
        if (id && id.trim() !== '') {
            const folderPath = `vehicles/${id}`;
            try {
                // Exclui todas as imagens que começam com o prefixo da pasta
                await cloudinary.api.delete_resources_by_prefix(`${folderPath}/`);

                // Tenta excluir a pasta vazia (se existir)
                try {
                    await cloudinary.api.delete_folder(folderPath);
                } catch (folderError: any) {
                    // Ignora erro se a pasta não existir ou não estiver vazia
                }
            } catch (cloudinaryError: any) {
                console.warn(`Erro ao excluir imagens/pasta do Cloudinary para veículo ${id}:`, cloudinaryError.message);
            }
        }

        // 2. Exclui os registros de imagem da coleção Image no banco de dados
        await Image.deleteMany({ vehicle_id: id });

        // 4. Exclui o registro do veículo da coleção Vehicle no banco de dados
        const result = await Vehicle.deleteOne({ _id: id, owner_id: ownerId });

        if (result.deletedCount === 0) {
            // Este caso idealmente não deveria ser alcançado se vehicleToDelete foi encontrado, mas por segurança
            return res.status(404).json({ message: 'Vehicle not found or you do not have permission to delete this vehicle' });
        }

        res.status(200).json({ message: 'Veículo excluído com sucesso' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor', error: err.message });
    }
};

export const getVehicleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const vehicleObject = vehicle.toJSON();

        res.status(200).json(vehicleObject);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar veículo', error: err.message });
    }
};