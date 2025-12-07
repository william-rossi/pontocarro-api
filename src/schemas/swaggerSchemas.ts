/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       properties:
 *         _id: { type: 'string', example: '60f...' }
 *         owner_id: { type: 'string', example: '60f...' }
 *         title: { type: 'string', example: 'Fusca 1970' }
 *         brand: { type: 'string', example: 'Volkswagen' }
 *         vehicleModel: { type: 'string', example: 'Fusca' }
 *         engine: { type: 'string', example: '1.5L' }
 *         year: { type: 'number', example: 1970 }
 *         price: { type: 'number', example: 15000 }
 *         mileage: { type: 'number', example: 50000 }
 *         state: { type: 'string', example: 'SP' }
 *         city: { type: 'string', example: 'São Paulo' }
 *         fuel: { type: 'string', example: 'Gasolina' }
 *         transmission: { type: 'string', example: 'Manual' }
 *         bodyType: { type: 'string', example: 'Hatch' }
 *         color: { type: 'string', example: 'Azul' }
 *         description: { type: 'string', example: 'Fusca em excelente estado de conservação.' }
 *         features: { type: 'array', items: { type: 'string' }, example: ['Ar condicionado', 'Vidros elétricos'] }
 *         images: { type: 'array', items: { $ref: '#/components/schemas/Image' } }
 *         announcerName: { type: 'string', example: 'João Silva' }
 *         announcerEmail: { type: 'string', format: 'email', example: 'joao.silva@example.com' }
 *         announcerPhone: { type: 'string', example: '+55 (11) 98765-4321' }
 *         created_at: { type: 'string', format: 'date-time' }
 *         firstImageUrl: { type: 'string', example: '/uploads/vehicles/some_image.jpg' }
 *     User:
 *       type: object
 *       properties:
 *         _id: { type: 'string', example: '60f...' }
 *         username: { type: 'string', example: 'john_doe' }
 *         email: { type: 'string', format: 'email', example: 'john.doe@example.com' }
 *         password: { type: 'string', format: 'password', example: 'securePassword123' }
 *         refreshToken: { type: 'string', example: 'eyJ...' }
 *         created_at: { type: 'string', format: 'date-time' }
 *     Image:
 *       type: object
 *       properties:
 *         _id: { type: 'string', example: 'ebe235d8-753f-40e3-9ecd-4aab6f389c5d' }
 *         vehicle_id: { type: 'string', example: '60f...' }
 *         imageUrl: { type: 'string', example: '/uploads/vehicles/image1.jpg' }
 *         created_at: { type: 'string', format: 'date-time' }
 *     Error:
 *       type: object
 *       properties:
 *         message: { type: 'string', example: 'Server error' }
 *         error: { type: 'string', example: 'Detailed error message' }
 */

/**
 * @swagger
 * paths:
 *   /user/{id}/update:
 *     put:
 *       summary: Update user profile
 *       description: Update the profile data for a specific user.
 *       tags:
 *         - User
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           description: ID of the user to update
 *           schema:
 *             type: string
 *           example: 60f...
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   example: "João Silva"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "joao.silva@example.com"
 *                 phone:
 *                   type: string
 *                   example: "(11) 98765-4321"
 *                 state:
 *                   type: string
 *                   example: "SP"
 *                 city:
 *                   type: string
 *                   example: "São Paulo"
 *                 password:
 *                   type: string
 *                   format: password
 *                   example: "Senha@123"
 *       responses:
 *         200:
 *           description: User profile updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Usuário atualizado com sucesso
 *                   refreshToken:
 *                     type: string
 *                     example: eyJhbGciOiJIUzI1Ni...
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Validation error
 *                   errors:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         code:
 *                           type: string
 *                           example: invalid_string
 *                         message:
 *                           type: string
 *                           example: Email inválido
 *                         path:
 *                           type: array
 *                           items:
 *                             type: string
 *                             example: email
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         404:
 *           description: User not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         500:
 *           description: Erro do servidor
 */

/**
 * @swagger
 * paths:
 *   /auth/reset-password/{resetToken}:
 *     post:
 *       summary: Redefine a senha do usuário
 *       description: Permite ao usuário redefinir sua senha usando um token de redefinição.
 *       tags:
 *         - Auth
 *       parameters:
 *         - in: path
 *           name: resetToken
 *           required: true
 *           description: Token de redefinição de senha
 *           schema:
 *             type: string
 *             example: um_token_aleatorio_e_longo
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - password
 *               properties:
 *                 password:
 *                   type: string
 *                   format: password
 *                   description: Nova senha do usuário (mínimo 8 caracteres)
 *                   example: NovaSenha@123
 *                 confirmPassword:
 *                   type: string
 *                   format: password
 *                   description: Confirmação da nova senha
 *                   example: NovaSenha@123
 *       responses:
 *         200:
 *           description: Senha redefinida com sucesso
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Senha redefinida com sucesso!
 *         400:
 *           description: Token inválido ou expirado / Erro de validação
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Token de redefinição de senha inválido ou expirado.
 *                   errors:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         path:
 *                           type: array
 *                           items:
 *                             type: string
 *                         message:
 *                           type: string
 *         500:
 *           description: Erro do servidor
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 */