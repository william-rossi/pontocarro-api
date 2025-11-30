import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../src/models/Vehicle';
import { initializeDatabase } from '../src/config/database';
import { faker } from '@faker-js/faker';
import path from 'path';
import fs from 'fs/promises';
import Image from '../src/models/Image'; // Import the Image model

dotenv.config();

const statesAndCities = [
    { state: 'SP', cities: ['São Paulo', 'Campinas', 'Ribeirão Preto', 'Santos'] },
    { state: 'RJ', cities: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Campos dos Goytacazes'] },
    { state: 'MG', cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'] },
    { state: 'RS', cities: ['Porto Alegre', 'Caxias do Sul', 'Florianópolis', 'Curitiba'] },
    { state: 'BA', cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari'] },
    { state: 'PR', cities: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'] },
    { state: 'SC', cities: ['Florianópolis', 'Joinville', 'Blumenau', 'São José'] },
    { state: 'DF', cities: ['Brasília'] },
    { state: 'GO', cities: ['Goiânia', 'Aparecida de Goiânia', 'Rio Verde'] },
    { state: 'AM', cities: ['Manaus'] },
    { state: 'PE', cities: ['Recife', 'Jaboatão dos Guararapes', 'Olinda'] },
    { state: 'CE', cities: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte'] },
    { state: 'PA', cities: ['Belém', 'Ananindeua', 'Santarém'] },
    { state: 'ES', cities: ['Vitória', 'Vila Velha', 'Serra'] },
    { state: 'MS', cities: ['Campo Grande', 'Dourados'] },
    { state: 'MT', cities: ['Cuiabá', 'Várzea Grande'] },
    { state: 'AL', cities: ['Maceió', 'Arapiraca'] },
    { state: 'SE', cities: ['Aracaju', 'Nossa Senhora do Socorro'] },
    { state: 'PB', cities: ['João Pessoa', 'Campina Grande'] },
    { state: 'RN', cities: ['Natal', 'Mossoró'] },
    { state: 'PI', cities: ['Teresina', 'Parnaíba'] },
    { state: 'MA', cities: ['São Luís', 'Imperatriz'] },
    { state: 'TO', cities: ['Palmas', 'Araguaína'] },
    { state: 'RO', cities: ['Porto Velho'] },
    { state: 'AC', cities: ['Rio Branco'] },
    { state: 'RR', cities: ['Boa Vista'] },
    { state: 'AP', cities: ['Macapá'] },
];

const brands = ['Volkswagen', 'Ford', 'Chevrolet', 'Toyota', 'Honda', 'Hyundai', 'Fiat', 'Renault', 'Mercedes-Benz', 'BMW', 'Audi', 'Nissan', 'Ferrari', 'Lamborghini', 'Porsche', 'McLaren'];
const models = {
    'Volkswagen': ['Gol', 'Virtus', 'T-Cross', 'Nivus', 'Jetta', 'Fusca'],
    'Ford': ['Ka', 'EcoSport', 'Ranger', 'Maverick', 'Mustang', 'GT'],
    'Chevrolet': ['Onix', 'Tracker', 'S10', 'Cruze', 'Spin', 'Camaro'],
    'Toyota': ['Corolla', 'Corolla Cross', 'Hilux', 'Yaris', 'SW4', 'Supra'],
    'Honda': ['HR-V', 'Civic', 'City', 'Fit', 'CR-V', 'NSX'],
    'Hyundai': ['HB20', 'Creta', 'Tucson', 'Santa Fe', 'i30', 'Veloster'],
    'Fiat': ['Argo', 'Cronos', 'Pulse', 'Strada', 'Toro', '500'],
    'Renault': ['Kwid', 'Sandero', 'Duster', 'Oroch', 'Captur', 'Megane RS'],
    'Mercedes-Benz': ['Classe C', 'Classe E', 'GLA', 'GLC', 'C180', 'AMG GT'],
    'BMW': ['Série 3', 'X1', 'X3', 'X4', '320i', 'M4'],
    'Audi': ['A3', 'Q3', 'Q5', 'A4', 'TT', 'R8'],
    'Nissan': ['Kicks', 'Frontier', 'Versa', 'Sentra', 'Leaf', 'GT-R'],
    'Ferrari': ['488 GTB', 'F8 Tributo', 'SF90 Stradale', '812 Superfast'],
    'Lamborghini': ['Huracan', 'Aventador', 'Urus', 'Gallardo'],
    'Porsche': ['911', 'Cayenne', 'Panamera', 'Macan'],
    'McLaren': ['720S', '570S', 'Artura', 'P1'],
};
const engines = ['1.0L', '1.4L', '1.6L', '1.8L', '2.0L', '2.5L', '3.0L V6', '4.0L V8', '5.2L V10', '6.5L V12'];
const fuels = ['Gasolina', 'Etanol', 'Flex', 'Diesel', 'Híbrido', 'Elétrico'];
const transmissions = ['Manual', 'Automático', 'CVT'];
const bodyTypes = ['Hatch', 'Sedan', 'SUV', 'Picape', 'Coupé', 'Perua'];
const colors = ['Preto', 'Branco', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo'];
const features = [
    'Ar condicionado',
    'Vidros elétricos',
    'Travas elétricas',
    'Direção hidráulica',
    'Alarme',
    'Freios ABS',
    'Airbags frontais',
    'Central multimídia',
    'Câmera de ré',
    'Sensor de estacionamento',
    'Bancos de couro',
    'Teto solar',
    'Rodas de liga leve',
    'Controle de tração',
    'Controle de estabilidade',
];

const generateVehicles = async () => {
    await initializeDatabase();

    try {
        console.log('Generating mock vehicles...');

        const imageDir = path.join(__dirname, '../uploads/vehicles');
        const imageFiles = await fs.readdir(imageDir);
        const availableImagePaths = imageFiles.map(file => `/uploads/vehicles/${file}`);

        if (availableImagePaths.length === 0) {
            console.warn('No images found in uploads/vehicles. Vehicles will be created without images.');
        }

        // Define a fixed owner_id for generated vehicles or fetch an existing one
        const fixedOwnerId = new mongoose.Types.ObjectId('69224a9650d68da93bc04c1f'); // Replace with a valid user ID from your DB
        // Or, to fetch an existing user:
        // const existingUser = await User.findOne({}); // Find any existing user
        // const ownerId = existingUser ? existingUser._id : new mongoose.Types.ObjectId();

        interface ParsedVehicleImage {
            filePath: string;
            brand?: string;
            model?: string;
            year?: number;
        }

        const parseVehicleNameFromFilename = (filename: string): { brand?: string, model?: string, year?: number } => {
            const result: { brand?: string, model?: string, year?: number } = {};
            const lowerFilename = filename.toLowerCase();

            // Try to extract year (e.g., 1966-ford-mustang)
            const yearMatch = filename.match(/(\d{4})-/);
            if (yearMatch && yearMatch[1]) {
                result.year = parseInt(yearMatch[1], 10);
            }

            // Try to extract brand and model from common patterns (e.g., TOYOTA_COROLLA, nissan-kicks)
            for (const brand of brands) {
                const lowerBrand = brand.toLowerCase();
                if (lowerFilename.includes(lowerBrand)) {
                    result.brand = brand;
                    const modelsForBrand = models[brand as keyof typeof models];
                    if (modelsForBrand) {
                        for (const model of modelsForBrand) {
                            const lowerModel = model.toLowerCase().replace(/\s/g, '-'); // replace spaces for comparison
                            if (lowerFilename.includes(lowerModel)) {
                                result.model = model;
                                break;
                            }
                        }
                    }
                    break;
                }
            }
            return result;
        };

        const groupedVehicleImages: { [key: string]: ParsedVehicleImage[] } = {};
        const allParsedImages: ParsedVehicleImage[] = [];

        for (const file of imageFiles) {
            const filePath = `/uploads/vehicles/${file}`;
            const { brand, model, year } = parseVehicleNameFromFilename(file);
            const parsedImage: ParsedVehicleImage = { filePath, brand, model, year };
            allParsedImages.push(parsedImage);

            if (brand && model) {
                const key = `${brand}-${model}${year ? `-${year}` : ''}`;
                if (!groupedVehicleImages[key]) {
                    groupedVehicleImages[key] = [];
                }
                groupedVehicleImages[key].push(parsedImage);
            }
        }

        // Clear existing vehicles and images to avoid duplicates on re-run
        await Vehicle.deleteMany({});
        await Image.deleteMany({});
        console.log('Cleared existing vehicles and images.');

        const supercarBrands = ['Ferrari', 'Lamborghini', 'Porsche', 'McLaren'];

        // Iterate through grouped images to create unique vehicle entries
        for (const key in groupedVehicleImages) {
            const imagesForVehicle = groupedVehicleImages[key];
            const firstImageParsed = imagesForVehicle[0];

            const vehicleBrand = firstImageParsed.brand || faker.helpers.arrayElement(brands);
            const vehicleModel = firstImageParsed.model || faker.helpers.arrayElement(models[vehicleBrand as keyof typeof models] || ['Generic Model']);
            const vehicleYear = firstImageParsed.year || faker.number.int({ min: 1990, max: new Date().getFullYear() + 1 });

            const isSupercar = supercarBrands.includes(vehicleBrand); // Determine if it's a supercar

            const randomStateInfo = faker.helpers.arrayElement(statesAndCities);
            const randomCity = faker.helpers.arrayElement(randomStateInfo.cities);
            const randomFuel = faker.helpers.arrayElement(fuels);
            const randomTransmission = faker.helpers.arrayElement(transmissions);
            const randomBodyType = faker.helpers.arrayElement(bodyTypes);
            const randomColor = faker.helpers.arrayElement(colors);
            const randomFeatures = faker.helpers.arrayElements(features, { min: 5, max: features.length });

            const vehicleId = new mongoose.Types.ObjectId().toString();
            const imageDocIds: string[] = [];

            for (const imageUrlPath of imagesForVehicle.map(img => img.filePath)) {
                const newImage = new Image({
                    vehicle_id: vehicleId,
                    imageUrl: imageUrlPath,
                });
                await newImage.save();
                imageDocIds.push(newImage._id);
            }

            const engine = faker.helpers.arrayElement(engines);
            const year = faker.number.int({ min: isSupercar ? 2000 : 1990, max: new Date().getFullYear() + 1 });
            const price = faker.number.float({ min: isSupercar ? 500000 : 15000, max: isSupercar ? 3000000 : 200000, fractionDigits: 2 });
            const mileage = faker.number.int({ min: 0, max: isSupercar ? 50000 : 200000 });

            const description = `Este ${year} ${vehicleBrand} ${vehicleModel} está em excelente condição. Possui um motor ${engine}, transmissão ${randomTransmission} e é movido a ${randomFuel}. Com apenas ${mileage.toLocaleString('pt-BR')} km rodados, este veículo ${randomBodyType} na cor ${randomColor} oferece os seguintes recursos: ${randomFeatures.join(', ')}. Uma oportunidade imperdível!`;

            const vehicleData = {
                _id: vehicleId,
                owner_id: fixedOwnerId,
                title: `${year} ${vehicleBrand} ${vehicleModel} ${engine}`,
                brand: vehicleBrand,
                vehicleModel: vehicleModel,
                engine: engine,
                year: year,
                price: price,
                mileage: mileage,
                state: randomStateInfo.state,
                city: randomCity,
                fuel: randomFuel,
                transmission: randomTransmission,
                bodyType: randomBodyType,
                color: randomColor,
                description: description,
                features: randomFeatures,
                images: imageDocIds,
                announcerName: faker.person.fullName(),
                announcerEmail: faker.internet.email(),
                announcerPhone: faker.helpers.replaceSymbols('(##) #####-####'),
            };

            const newVehicle = new Vehicle(vehicleData);
            await newVehicle.save();
            console.log(`Created vehicle: ${newVehicle.title} with images: ${imageDocIds.length}`);
        }

        console.log('Mock vehicle generation complete!');
    } catch (error) {
        console.error('Error generating mock vehicles:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

generateVehicles();