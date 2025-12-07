import { Request, Response } from 'express';
import User from '../models/User'; // Importa o modelo de Usuário do Mongoose
import Vehicle from '../models/Vehicle'; // Importa o modelo de Veículo do Mongoose
import { createUserSchema } from '../schemas/userSchema';
import bcrypt from 'bcryptjs';

/**
 * @api {put} /user/profile Atualizar perfil do usuário
 * @apiGroup User
 * @apiHeader {String} Authorization Token de acesso único do usuário
 * @apiParam {String} [username] Nome de usuário
 * @apiParam {String} [email] E-mail do usuário
 * @apiParam {String} [phone] Número de telefone do usuário
 * @apiParam {String} [state] Estado do usuário
 * @apiParam {String} [city] Cidade do usuário
 * @apiSuccess {String} message Mensagem de sucesso
 * @apiSuccess {Object} user Objeto de usuário atualizado
 * @apiSuccessExample {json} Resposta de Sucesso:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Perfil do usuário atualizado com sucesso",
 *       "user": {
 *         "_id": "65bb7b1c3e3a3e3e3e3e3e3e",
 *         "username": "updateduser",
 *         "email": "updated@example.com",
 *         "phone": "11987654321",
 *         "state": "SP",
 *         "city": "Sao Paulo"
 *       }
 *     }
 * @apiError {String} message Mensagem de erro
 * @apiError {Array} [errors] Array de erros de validação se a validação falhar
 * @apiErrorExample {json} Resposta de Erro - Usuário Não Encontrado:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "Usuário não encontrado"
 *     }
 * @apiErrorExample {json} Resposta de Erro - Validação:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message": "Erro de validação",
 *       "errors": [
 *         { "code": "invalid_string", "message": "Email inválido", "path": ["email"] }
 *       ]
 *     }
 * @apiErrorExample {json} Resposta de Erro - Não Autorizado:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Sem token, autorização negada"
 *     }
 * @apiErrorExample {json} Resposta de Erro - Servidor:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": "Erro do servidor"
 *     }
 */
export const updateUserProfile = async (req: Request, res: Response) => {
    const { id: userId } = req.params; // Obtém o userId dos parâmetros da URL

    try {
        // Valida o corpo da requisição contra um esquema de usuário parcial para permitir atualizações parciais
        const validatedData = createUserSchema.partial().parse(req.body);

        if (validatedData.password) {
            const salt = await bcrypt.genSalt(10);
            validatedData.password = await bcrypt.hash(validatedData.password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: validatedData },
            { new: true, runValidators: true }
        ).select('-password'); // Exclui a senha do objeto de usuário retornado

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.status(200).json({ message: 'Perfil do usuário atualizado com sucesso', user: updatedUser });
    } catch (err: any) {
        if (err.name === 'ZodError') {
            return res.status(400).json({ message: 'Erro de validação', errors: err.errors });
        }
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor' });
    }
};

/**
 * @api {delete} /user/delete Excluir conta de usuário
 * @apiGroup User
 * @apiHeader {String} Authorization Token de acesso único do usuário
 * @apiSuccess {String} message Mensagem de sucesso
 * @apiSuccessExample {json} Resposta de Sucesso:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Conta de usuário excluída com sucesso"
 *     }
 * @apiError {String} message Mensagem de erro
 * @apiErrorExample {json} Resposta de Erro - Usuário Não Encontrado:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "Usuário não encontrado"
 *     }
 * @apiErrorExample {json} Resposta de Erro - Não Autorizado:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Não autorizado"
 *     }
 * @apiErrorExample {json} Resposta de Erro - Servidor:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": "Erro do servidor"
 *     }
 */
export const deleteUserAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.id; // user._id é anexado pelo middleware authenticateUser

    try {
        // Exclui todos os veículos associados ao usuário
        await Vehicle.deleteMany({ owner_id: userId });

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.status(200).json({ message: 'Conta de usuário excluída com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro do servidor' });
    }
};