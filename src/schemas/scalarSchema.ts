const PORT = process.env.PORT || 3001;

export const openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'PontoCarro API',
        version: '1.0.0',
        description: 'Documentação completa da API para a aplicação PontoCarro',
    },
    servers: [
        {
            url: `http://localhost:${PORT}`,
            description: 'Servidor de desenvolvimento',
        },
    ],
    security: [
        {
            bearerAuth: [],
        },
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
                properties: {
                    _id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                },
            },
            Vehicle: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    owner_id: { type: 'string' },
                    title: { type: 'string' },
                    brand: { type: 'string' },
                    vehicleModel: { type: 'string' },
                    engine: { type: 'string' },
                    year: { type: 'number' },
                    price: { type: 'number' },
                    mileage: { type: 'number' },
                    state: { type: 'string' },
                    city: { type: 'string' },
                    fuel: { type: 'string' },
                    transmission: { type: 'string' },
                    bodyType: { type: 'string' },
                    color: { type: 'string' },
                    description: { type: 'string' },
                    features: { type: 'array', items: { type: 'string' } },
                    images: { type: 'array', items: { $ref: '#/components/schemas/Image' } },
                    announcerName: { type: 'string' },
                    announcerEmail: { type: 'string', format: 'email' },
                    announcerPhone: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    firstImageUrl: { type: 'string' },
                },
            },
            Image: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    vehicle_id: { type: 'string' },
                    imageUrl: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    error: { type: 'string' },
                    errors: { type: 'array', items: { type: 'object' } },
                },
            },
        },
    },
    paths: {
        // Authentication routes
        '/auth/register': {
            post: {
                tags: ['Authentication'],
                summary: 'Registrar novo usuário',
                description: 'Cria uma nova conta de usuário no sistema',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['username', 'email', 'password'],
                                properties: {
                                    username: { type: 'string', example: 'João Silva' },
                                    email: { type: 'string', format: 'email', example: 'joao.silva@example.com' },
                                    password: { type: 'string', format: 'password', example: 'Senha@123' },
                                    phone: { type: 'string', example: '+55 (11) 98765-4321' },
                                    city: { type: 'string', example: 'São Paulo' },
                                    state: { type: 'string', example: 'SP' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Usuário registrado com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        accessToken: { type: 'string' },
                                        userId: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Dados inválidos ou usuário já existe',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'Fazer login',
                description: 'Autentica um usuário e retorna tokens de acesso',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'joao.silva@example.com' },
                                    password: { type: 'string', format: 'password', example: 'Senha@123' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Login realizado com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        accessToken: { type: 'string' },
                                        user: { $ref: '#/components/schemas/User' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Credenciais inválidas',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/auth/forgot-password': {
            post: {
                tags: ['Authentication'],
                summary: 'Solicitar redefinição de senha',
                description: 'Envia um e-mail com instruções para redefinir a senha',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'joao.silva@example.com' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Instruções enviadas por e-mail',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Usuário não encontrado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/auth/reset-password/{resetToken}': {
            post: {
                tags: ['Authentication'],
                summary: 'Redefinir senha',
                description: 'Redefine a senha do usuário usando o token enviado por e-mail',
                parameters: [
                    {
                        name: 'resetToken',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'Token de redefinição de senha',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['password'],
                                properties: {
                                    password: { type: 'string', format: 'password', example: 'NovaSenha@123' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Senha redefinida com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Token inválido ou dados inválidos',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/auth/refresh-token': {
            post: {
                tags: ['Authentication'],
                summary: 'Renovar token de acesso',
                description: 'Gera um novo token de acesso usando o refresh token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['refreshToken'],
                                properties: {
                                    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Tokens renovados com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Refresh token inválido',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },

        // Vehicle routes
        '/vehicles': {
            get: {
                tags: ['Vehicles'],
                summary: 'Listar todos os veículos',
                description: 'Retorna uma lista paginada de todos os veículos disponíveis',
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 },
                        description: 'Número da página',
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                        description: 'Itens por página',
                    },
                    {
                        name: 'sortBy',
                        in: 'query',
                        schema: { type: 'string', enum: ['createdAt', 'price', 'year', 'mileage'] },
                        description: 'Campo para ordenação',
                    },
                    {
                        name: 'sortOrder',
                        in: 'query',
                        schema: { type: 'string', enum: ['asc', 'desc'] },
                        description: 'Ordem de ordenação',
                    },
                ],
                responses: {
                    200: {
                        description: 'Lista de veículos retornada com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        vehicles: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Vehicle' },
                                        },
                                        currentPage: { type: 'integer' },
                                        totalPages: { type: 'integer' },
                                        totalVehicles: { type: 'integer' },
                                        firstImageUrl: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Vehicles'],
                summary: 'Criar novo veículo',
                description: 'Cria um novo anúncio de veículo (requer autenticação)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title', 'brand', 'vehicleModel', 'year', 'price', 'mileage', 'state', 'city', 'fuel', 'transmission', 'color', 'announcerName', 'announcerEmail'],
                                properties: {
                                    title: { type: 'string', example: 'Fusca 1970' },
                                    brand: { type: 'string', example: 'Volkswagen' },
                                    vehicleModel: { type: 'string', example: 'Fusca' },
                                    engine: { type: 'string', example: '1.5L' },
                                    year: { type: 'number', example: 1970 },
                                    price: { type: 'number', example: 15000 },
                                    mileage: { type: 'number', example: 50000 },
                                    state: { type: 'string', example: 'SP' },
                                    city: { type: 'string', example: 'São Paulo' },
                                    fuel: { type: 'string', example: 'Gasolina' },
                                    transmission: { type: 'string', example: 'Manual' },
                                    bodyType: { type: 'string', example: 'Hatch' },
                                    color: { type: 'string', example: 'Azul' },
                                    description: { type: 'string', example: 'Fusca em excelente estado de conservação.' },
                                    features: { type: 'array', items: { type: 'string' }, example: ['Ar condicionado', 'Vidros elétricos'] },
                                    announcerName: { type: 'string', example: 'João Silva' },
                                    announcerEmail: { type: 'string', format: 'email', example: 'joao.silva@example.com' },
                                    announcerPhone: { type: 'string', example: '+55 (11) 98765-4321' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Veículo criado com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        vehicle: { $ref: '#/components/schemas/Vehicle' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Dados inválidos',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    401: {
                        description: 'Não autorizado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/vehicles/search': {
            get: {
                tags: ['Vehicles'],
                summary: 'Buscar veículos',
                description: 'Busca veículos por termo de pesquisa',
                parameters: [
                    {
                        name: 'q',
                        in: 'query',
                        required: true,
                        schema: { type: 'string' },
                        description: 'Termo de busca',
                    },
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 },
                        description: 'Número da página',
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                        description: 'Itens por página',
                    },
                ],
                responses: {
                    200: {
                        description: 'Resultados da busca',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        vehicles: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Vehicle' },
                                        },
                                        currentPage: { type: 'integer' },
                                        totalPages: { type: 'integer' },
                                        totalVehicles: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Termo de busca não fornecido',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/vehicles/by-city-state': {
            get: {
                tags: ['Vehicles'],
                summary: 'Buscar veículos por cidade e estado',
                description: 'Retorna veículos filtrados por cidade e estado',
                parameters: [
                    {
                        name: 'city',
                        in: 'query',
                        schema: { type: 'string' },
                        description: 'Cidade',
                    },
                    {
                        name: 'state',
                        in: 'query',
                        schema: { type: 'string' },
                        description: 'Estado',
                    },
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 },
                        description: 'Número da página',
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                        description: 'Itens por página',
                    },
                ],
                responses: {
                    200: {
                        description: 'Veículos encontrados',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        vehicles: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Vehicle' },
                                        },
                                        currentPage: { type: 'integer' },
                                        totalPages: { type: 'integer' },
                                        totalVehicles: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/vehicles/{id}': {
            get: {
                tags: ['Vehicles'],
                summary: 'Buscar veículo por ID',
                description: 'Retorna os detalhes de um veículo específico',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do veículo',
                    },
                ],
                responses: {
                    200: {
                        description: 'Veículo encontrado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        vehicle: { $ref: '#/components/schemas/Vehicle' },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Veículo não encontrado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
            put: {
                tags: ['Vehicles'],
                summary: 'Atualizar veículo',
                description: 'Atualiza os dados de um veículo (requer autenticação e propriedade)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do veículo',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    brand: { type: 'string' },
                                    vehicleModel: { type: 'string' },
                                    engine: { type: 'string' },
                                    year: { type: 'number' },
                                    price: { type: 'number' },
                                    mileage: { type: 'number' },
                                    state: { type: 'string' },
                                    city: { type: 'string' },
                                    fuel: { type: 'string' },
                                    transmission: { type: 'string' },
                                    bodyType: { type: 'string' },
                                    color: { type: 'string' },
                                    description: { type: 'string' },
                                    features: { type: 'array', items: { type: 'string' } },
                                    announcerName: { type: 'string' },
                                    announcerEmail: { type: 'string', format: 'email' },
                                    announcerPhone: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Veículo atualizado com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        vehicle: { $ref: '#/components/schemas/Vehicle' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Dados inválidos',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    401: {
                        description: 'Não autorizado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    404: {
                        description: 'Veículo não encontrado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ['Vehicles'],
                summary: 'Excluir veículo',
                description: 'Remove um veículo do sistema (requer autenticação e propriedade)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do veículo',
                    },
                ],
                responses: {
                    200: {
                        description: 'Veículo excluído com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Não autorizado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    404: {
                        description: 'Veículo não encontrado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/vehicles/{id}/my-vehicles': {
            get: {
                tags: ['Vehicles'],
                summary: 'Listar veículos do usuário',
                description: 'Retorna todos os veículos de um usuário específico (requer autenticação)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do usuário',
                    },
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 },
                        description: 'Número da página',
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                        description: 'Itens por página',
                    },
                ],
                responses: {
                    200: {
                        description: 'Veículos do usuário retornados com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        vehicles: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Vehicle' },
                                        },
                                        currentPage: { type: 'integer' },
                                        totalPages: { type: 'integer' },
                                        totalVehicles: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Não autorizado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/vehicles/{id}/images': {
            post: {
                tags: ['Vehicles'],
                summary: 'Upload de imagens',
                description: 'Faz upload de imagens para um veículo específico (requer autenticação e propriedade)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do veículo',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    images: {
                                        type: 'array',
                                        items: { type: 'string', format: 'binary' },
                                        description: 'Arquivos de imagem (máximo 10 imagens)',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Imagens enviadas com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        images: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Image' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Dados inválidos ou limite de imagens excedido',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    401: {
                        description: 'Não autorizado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    404: {
                        description: 'Veículo não encontrado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/vehicles/{id}/images/{imageId}': {
            delete: {
                tags: ['Vehicles'],
                summary: 'Excluir imagem',
                description: 'Remove uma imagem específica de um veículo (requer autenticação e propriedade)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do veículo',
                    },
                    {
                        name: 'imageId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID da imagem',
                    },
                ],
                responses: {
                    200: {
                        description: 'Imagem excluída com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Não autorizado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    404: {
                        description: 'Veículo ou imagem não encontrada',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },

        // User routes
        '/user/{id}/update': {
            put: {
                tags: ['Users'],
                summary: 'Atualizar perfil do usuário',
                description: 'Atualiza os dados do perfil de um usuário (requer autenticação)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do usuário',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    username: { type: 'string', example: 'João Silva Atualizado' },
                                    email: { type: 'string', format: 'email', example: 'joao.atualizado@example.com' },
                                    phone: { type: 'string', example: '+55 (11) 98765-4321' },
                                    city: { type: 'string', example: 'São Paulo' },
                                    state: { type: 'string', example: 'SP' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Perfil atualizado com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        user: { $ref: '#/components/schemas/User' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Dados inválidos',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    401: {
                        description: 'Não autorizado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    404: {
                        description: 'Usuário não encontrado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/user/delete': {
            delete: {
                tags: ['Users'],
                summary: 'Excluir conta do usuário',
                description: 'Remove permanentemente a conta do usuário e todos os seus dados (requer autenticação)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Conta excluída com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Não autorizado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },

        // Image routes
        '/images/{vehicleId}': {
            get: {
                tags: ['Images'],
                summary: 'Listar imagens de um veículo',
                description: 'Retorna todas as imagens associadas a um veículo específico',
                parameters: [
                    {
                        name: 'vehicleId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do veículo',
                    },
                ],
                responses: {
                    200: {
                        description: 'Imagens retornadas com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        images: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Image' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Veículo não encontrado',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/images/{vehicleId}/first': {
            get: {
                tags: ['Images'],
                summary: 'Obter primeira imagem do veículo',
                description: 'Retorna a primeira imagem de um veículo específico',
                parameters: [
                    {
                        name: 'vehicleId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID do veículo',
                    },
                ],
                responses: {
                    200: {
                        description: 'Primeira imagem retornada com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        image: { $ref: '#/components/schemas/Image' },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Veículo ou imagem não encontrada',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/images/image/{imageId}': {
            get: {
                tags: ['Images'],
                summary: 'Obter imagem por ID',
                description: 'Retorna os detalhes de uma imagem específica',
                parameters: [
                    {
                        name: 'imageId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'ID da imagem',
                    },
                ],
                responses: {
                    200: {
                        description: 'Imagem retornada com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        image: { $ref: '#/components/schemas/Image' },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Imagem não encontrada',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    500: {
                        description: 'Erro interno do servidor',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
    },
};