import { z } from 'zod';

export const createUserSchema = z
    .object({
        username: z
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
            .min(1, "Campo obrigatório")
            .min(10, "Telefone inválido (mínimo 10 caracteres)")
            .max(11, "Telefone inválido (máximo 11 caracteres)"),
        state: z.string().min(1, "Campo obrigatório"),
        city: z.string().min(1, "Campo obrigatório")
    })

export const forgotPasswordSchema = z.object({
    email: z.string().email("E-mail inválido"),
});