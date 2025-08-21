import { z } from 'zod';

export const createUserSchema = z
    .object({
        username: z // Mapeando 'name' para 'username'
            .string()
            .min(3, "Nome deve ter no mínimo 3 caracteres")
            .max(100, "Nome muito longo"),
        email: z
            .string()
            .min(1, "E-mail é obrigatório")
            .max(150, "E-mail muito longo")
            .email("E-mail inválido"),
        password: z
            .string()
            .min(8, "A senha deve ter pelo menos 8 caracteres")
            .max(50, "A senha deve ter no máximo 50 caracteres")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                "A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial"
            ),
        phone: z
            .string()
            .min(14, "Telefone inválido")
            .regex(
                /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                "Telefone deve estar no formato (11) 99999-9999 ou (11) 3333-3333"
            ),
        location: z
            .string()
            .min(2, "Localização é obrigatória")
            .max(80, "Localização muito longa"),
    })
