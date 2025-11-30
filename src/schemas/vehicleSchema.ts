import { z } from 'zod';

export const vehicleSchema = z.object({
    title: z.string().min(1, "Título é obrigatório").max(100, "Título muito longo"),
    brand: z.string().min(1, "Marca é obrigatória").max(50, "Marca muito longa"),
    vehicleModel: z.string().min(1, "Modelo é obrigatório").max(50, "Modelo muito longo"),
    engine: z.string().min(1, "Motorização é obrigatória").max(50, "Motorização muito longa"),
    year: z.number().int().min(1900, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
    price: z.number().min(0, "Preço inválido"),
    mileage: z.number().min(0, "Quilometragem inválida"),
    state: z.string().min(1, "Estado é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    fuel: z.string().min(1, "Combustível é obrigatório"),
    transmission: z.string().min(1, "Câmbio é obrigatório"),
    bodyType: z.string().min(1, "Tipo de carroceria é obrigatório"),
    color: z.string().min(1, "Cor é obrigatória").max(50, "Cor muito longa"),
    description: z.string().min(1, "Descrição é obrigatória").max(1000, "Descrição muito longa"),
    features: z.array(z.string()).max(10, "Máximo de 10 características").optional(),
    images: z.array(z.string()).max(10, "Máximo de 10 fotos").optional(),
    announcerName: z.string().min(3, "Nome do anunciante deve ter no mínimo 3 caracteres").max(100, "Nome do anunciante muito longo"),
    announcerEmail: z.string().min(1, "E-mail do anunciante é obrigatório").max(150, "E-mail do anunciante muito longo").email("E-mail do anunciante inválido"),
    announcerPhone: z.string().min(1, "Telefone do anunciante é obrigatório").min(10, "Telefone do anunciante inválido (mínimo 10 caracteres)").max(11, "Telefone do anunciante inválido (máximo 11 caracteres)"),
});
