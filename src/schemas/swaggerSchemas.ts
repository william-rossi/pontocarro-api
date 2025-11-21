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
