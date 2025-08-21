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
