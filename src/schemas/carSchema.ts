import { z } from 'zod';

export const carSchema = z.object({
    make: z.string().min(2, "A marca deve ter no mínimo 2 caracteres").max(50, "Marca muito longa"),
    carModel: z.string().min(2, "O modelo deve ter no mínimo 2 caracteres").max(50, "Modelo muito longo"),
    year: z.number().int().min(1900, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
    price: z.number().int().optional().nullable().refine(val => val === null || val === undefined || val >= 0, { message: "Preço deve ser um número positivo" }),
    description: z.string().max(500, "Descrição muito longa").optional(),
    location: z.string().min(2, "A localização deve ter no mínimo 2 caracteres").max(80, "Localização muito longa").optional(),
    engineType: z.string().max(50, "Tipo de motor muito longo").optional(),
    vehicleType: z.string().max(50, "Tipo de veículo muito longo").optional(),
    fuelType: z.string().max(50, "Tipo de combustível muito longo").optional(),
    transmission: z.string().max(50, "Tipo de transmissão muito longo").optional(),
    mileage: z.number().int().optional().nullable().refine(val => val === null || val === undefined || val >= 0, { message: "Quilometragem deve ser um número positivo" }),
});
