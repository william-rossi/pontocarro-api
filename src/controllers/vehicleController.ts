import { Request, Response } from 'express';
import Vehicle from '../models/Vehicle'; // Importa o modelo de Veículo do Mongoose
import { vehicleSchema } from '../schemas/vehicleSchema'; // Importa vehicleSchema
import { z } from 'zod'; // Importa zod para erros de validação
import fs from 'fs';
import path from 'path';
import Image from '../models/Image'; // Importa o modelo de Imagem
import cloudinary from '../config/cloudinary'; // Importa configuração do Cloudinary

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

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Obtém todos os veículos disponíveis com paginação
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Número da página (padrão: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Itens por página (padrão: 10)"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: ['createdAt', 'price', 'year', 'mileage']
 *         description: "Campo para ordenação (padrão: 'createdAt')"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: ['asc', 'desc']
 *         description: "Ordem de ordenação (padrão: 'desc' para createdAt, 'asc' para outros)"
 *     responses:
 *       200:
 *         description: Lista de veículos com informações de paginação
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
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/vehicles/some_image.jpg
 *       500:
 *         description: Erro do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /vehicles/{id}/my-vehicles:
 *   get:
 *     summary: Obtém todos os veículos de um usuário específico com paginação
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário para o qual os veículos serão recuperados
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Número da página (padrão: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Itens por página (padrão: 10)"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: ['createdAt', 'price', 'year', 'mileage']
 *         description: "Campo para ordenação (padrão: 'createdAt')"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: ['asc', 'desc']
 *         description: "Ordem de ordenação (padrão: 'desc' para createdAt, 'asc' para outros)"
 *     responses:
 *       200:
 *         description: Lista de veículos de propriedade do usuário com informações de paginação
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
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/vehicles/some_image.jpg
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Proibido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

        // Normaliza sortBy para 'created_at' se vier como 'createdAt'
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

/**
 * @swagger
 * /vehicles/search:
 *   get:
 *     summary: Busca veículos por múltiplos critérios com paginação
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Termo de busca para título, marca, modelo, cor, ano, estado ou cidade
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Marca do veículo
 *       - in: query
 *         name: vehicleModel
 *         schema:
 *           type: string
 *         description: Modelo do veículo
 *       - in: query
 *         name: engine
 *         schema:
 *           type: string
 *         description: Motorização do veículo
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Ano do veículo
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Preço máximo
 *       - in: query
 *         name: minYear
 *         schema:
 *           type: number
 *         description: Ano mínimo
 *       - in: query
 *         name: maxYear
 *         schema:
 *           type: number
 *         description: Ano máximo
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Estado do veículo
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Cidade do veículo
 *       - in: query
 *         name: fuel
 *         schema:
 *           type: string
 *         description: Tipo de combustível do veículo
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *         description: Tipo de transmissão do veículo
 *       - in: query
 *         name: bodyType
 *         schema:
 *           type: string
 *         description: Tipo de carroceria do veículo
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Cor do veículo
 *       - in: query
 *         name: minMileage
 *         schema:
 *           type: number
 *         description: Quilometragem mínima
 *       - in: query
 *         name: maxMileage
 *         schema:
 *           type: number
 *         description: Quilometragem máxima
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Número da página (padrão: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Itens por página (padrão: 10)"
 *     responses:
 *       200:
 *         description: Lista de veículos filtrados com informações de paginação
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
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/vehicles/some_image.jpg
 *       500:
 *         description: Erro do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /vehicles/by-city-state:
 *   get:
 *     summary: Obtém veículos por cidade e estado
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
 *         description: Lista de veículos encontrados para a cidade e estado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Erro de Parâmetros Ausentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Por favor, forneça uma cidade e estado para buscar
 *       500:
 *         description: Erro do Servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro ao buscar veículos por cidade e estado
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
 *     summary: Publica um novo veículo para venda
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
 *         description: Veículo publicado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veículo publicado com sucesso
 *                 vehicle:
 *                   $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Dados do veículo inválidos ou Erro de Validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dados do veículo inválidos
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
 *                   example: "Não autorizado: ID do usuário não encontrado"
 *       500:
 *         description: Erro do servidor
 */
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
 *         description: Veículo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veículo atualizado com sucesso
 *                 vehicle:
 *                   $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Erro de Validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro de Validação
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
 *                   example: Não autorizado
 *       404:
 *         description: Veículo não encontrado ou permissão negada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veículo não encontrado ou você não tem permissão para editar este veículo
 *       500:
 *         description: Erro do servidor
 */
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

/**
 * @swagger
 * /vehicles/{id}/images:
 *   post:
 *     summary: Upload de imagens do veículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo para upload de imagens
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
 *                 description: Até 10 arquivos de imagem (jpeg, jpg, png, gif, webp)
 *     responses:
 *       200:
 *         description: Imagens carregadas com sucesso
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
 *                   example: ["https://res.cloudinary.com/your-cloud/image/upload/q_auto,f_auto/v1234567890/vehicles/uuid.webp"]
 *                 imageIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["uuid-1", "uuid-2"]
 *       400:
 *         description: Nenhum arquivo fornecido ou limite excedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot upload more than 10 images. You already have 5 images.
 *       404:
 *         description: Veículo não encontrado ou sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found or you do not have permission to upload images for this vehicle
 *       500:
 *         description: Erro do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error uploading images
 */

/**
 * @swagger
 * /vehicles/{id}/images/{imageId}:
 *   delete:
 *     summary: Exclui uma imagem do veículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da imagem a ser excluída
 *     responses:
 *       200:
 *         description: Imagem excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Imagem excluída com sucesso
 *       404:
 *         description: Não encontrado/Erro de permissão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veículo não encontrado ou você não tem permissão para excluir imagens deste veículo
 *       500:
 *         description: Erro do servidor
 */
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

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Exclui um veículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo a ser excluído
 *     responses:
 *       200:
 *         description: Veículo excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veículo excluído com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Não autorizado
 *       404:
 *         description: Não encontrado/Erro de permissão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veículo não encontrado ou você não tem permissão para excluir este veículo
 *       500:
 *         description: Erro do servidor
 */
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
                console.log(`Excluindo todas as imagens da pasta: ${folderPath}`);
                // Exclui todas as imagens que começam com o prefixo da pasta
                const deleteResult = await cloudinary.api.delete_resources_by_prefix(`${folderPath}/`);
                console.log('Imagens excluídas do Cloudinary:', deleteResult);

                // Tenta excluir a pasta vazia (se existir)
                try {
                    await cloudinary.api.delete_folder(folderPath);
                    console.log(`Pasta excluída: ${folderPath}`);
                } catch (folderError: any) {
                    // Ignora erro se a pasta não existir ou não estiver vazia
                    console.log(`Pasta ${folderPath} não pôde ser excluída (pode não existir ou não estar vazia):`, folderError.message);
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

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Obtém um veículo por ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do veículo a ser recuperado
 *     responses:
 *       200:
 *         description: Veículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Veículo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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