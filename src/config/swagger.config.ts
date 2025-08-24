import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'PontoCarro API',
      version: '1.0.0',
      description: 'Documentação da API do PontoCarro',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento',
      },
      // Adicione outros servidores de produção aqui quando houver
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            id: {
              type: 'string',
              description: 'User unique ID.',
            },
            email: {
              type: 'string',
              description: 'User email address.',
            },
            password: {
              type: 'string',
              description: 'User password.',
            },
            phone: {
              type: 'string',
              description: 'User phone number.',
            },
            city: {
              type: 'string',
              description: 'User city.',
            },
            state: {
              type: 'string',
              description: 'User state.',
            },
            refreshToken: {
              type: 'string',
              description: 'User refresh token.',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // Path correctly points to src/routes from project root
    './src/controllers/*.ts', // Path correctly points to src/controllers from project root
    // Adicione mais caminhos se seus comentários JSDoc estiverem em outros lugares
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
