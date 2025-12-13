# PontoCarro API

Este é um projeto de API robusto e bem estruturado, desenvolvido com Express.js e TypeScript, projetado para um marketplace de veículos. Ele oferece um conjunto completo de endpoints para listagens públicas de veículos, funcionalidades de busca avançada, autenticação de usuários segura e gerenciamento autenticado de veículos e imagens.

## Setup

1.  **Clone o repositório** (se você ainda não o fez):
    ```bash
    git clone <repository-url>
    cd pontocarro-API
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configuração das Variáveis de Ambiente**:

    Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example`, e configure as seguintes variáveis:

    ```
    PORT=3001
    MONGO_URI=mongodb://localhost:27017/pontocarro_db
    JWT_SECRET=your_super_secret_jwt_key_here
    GMAIL_ADDRESS=your_email@gmail.com
    GMAIL_APP_PASSWORD=your_gmail_app_password
    FRONTEND_DOMAIN=http://localhost:3000
    ```

    *   `PORT`: A porta em que o servidor Express será executado (ex: `3001`).
    *   `MONGO_URI`: A URI de conexão para o seu banco de dados MongoDB (ex: `mongodb://localhost:27017/pontocarro_db`).
    *   `JWT_SECRET`: Uma string forte e aleatória para a assinatura dos tokens JWT.
    *   `GMAIL_ADDRESS`: Seu endereço de e-mail do Gmail para envio de e-mails (ex: recuperação de senha).
    *   `GMAIL_APP_PASSWORD`: A senha de aplicativo gerada para o seu Gmail. Veja [como gerar uma senha de aplicativo](https://support.google.com/accounts/answer/185833?hl=pt-BR).
    *   `FRONTEND_DOMAIN`: O domínio do seu aplicativo frontend para configuração de CORS e e-mails de recuperação de senha.

4.  **Execute o servidor**:

    *   **Modo de Desenvolvimento (com recarregamento automático)**:
        ```bash
        npm run dev
        ```

    *   **Modo de Produção (compila e executa)**:
        ```bash
        npm run build
        npm start
        ```

    O servidor será iniciado na porta configurada em `PORT` (padrão: `3001`).

## Testes

O projeto inclui uma suíte de testes automatizados usando Jest e Supertest.

### Executando os Testes

*   **Executar todos os testes**:
    ```bash
    npm test
    ```

*   **Executar testes em modo watch (re-executa automaticamente quando há mudanças)**:
    ```bash
    npm run test:watch
    ```

*   **Executar testes com relatório de cobertura**:
    ```bash
    npm run test:coverage
    ```

### Estrutura dos Testes

```
tests/
├── setup.ts          # Configuração global dos testes e mocks
├── app.test.ts       # Testes básicos da aplicação
└── auth.test.ts      # Testes de validação de schemas e utilitários
```

### Cobertura de Testes

Os testes atuais cobrem:

- ✅ **Validação de Schemas**: Testes dos schemas Zod para entrada de dados
- ✅ **Configurações**: Validação de variáveis de ambiente
- ✅ **Utilitários**: Funções auxiliares e configurações básicas
- ✅ **Testes Unitários**: Lógica de negócio isolada com mocks

### Executando Testes em Desenvolvimento

Para executar os testes durante o desenvolvimento:

```bash
# Terminal 1: Executar aplicação em modo dev
npm run dev

# Terminal 2: Executar testes em modo watch
npm run test:watch
```

## Documentação da API

A API possui documentação interativa completa usando **Scalar API Reference**.

### Acessando a Documentação

Após iniciar o servidor, acesse:
```
http://localhost:3001/api-docs
```

### Funcionalidades da Documentação

- 📋 **Documentação Completa**: Todos os endpoints documentados com descrições detalhadas
- 🔒 **Autenticação Integrada**: Suporte nativo a JWT Bearer Token
- 📊 **Schemas Detalhados**: Definições completas de request/response
- 🎨 **Interface Moderna**: UI responsiva e intuitiva
- 🧪 **Testes Interativos**: Possibilidade de testar endpoints diretamente na documentação
- 📝 **Exemplos Práticos**: Requests e responses de exemplo

## Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web para Node.js
- **TypeScript** - Superset tipado do JavaScript
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB

### Autenticação e Segurança
- **JWT (JSON Web Tokens)** - Autenticação stateless
- **bcryptjs** - Hashing de senhas
- **CORS** - Controle de acesso cross-origin

### Validação e Schemas
- **Zod** - Validação de schemas TypeScript-first

### Upload e Armazenamento
- **Multer** - Middleware para upload de arquivos
- **Cloudinary** - CDN e armazenamento de imagens

### Comunicação
- **Nodemailer** - Envio de e-mails
- **Gmail SMTP** - Serviço de e-mail

### Documentação
- **Scalar API Reference** - Documentação interativa moderna
- **OpenAPI 3.0** - Especificação da API

### Desenvolvimento
- **Jest** - Framework de testes
- **Supertest** - Testes de integração HTTP
- **ts-node-dev** - Hot reload para desenvolvimento TypeScript
- **ESLint/Prettier** - Linting e formatação de código

## Arquitetura

```
src/
├── controllers/     # Lógica dos endpoints
├── models/         # Schemas do MongoDB
├── routes/         # Definição das rotas
├── schemas/        # Validações Zod
├── middleware/     # Middlewares customizados
├── config/         # Configurações (DB, email, etc.)
└── app.ts          # Aplicação principal
```

### Princípios Arquiteturais

- **MVC Pattern**: Separação clara entre Models, Views e Controllers
- **RESTful API**: Seguindo princípios REST
- **Middleware Pattern**: Uso extensivo de middlewares Express
- **Dependency Injection**: Injeção de dependências onde apropriado
- **Error Handling**: Tratamento consistente de erros
- **Security First**: Autenticação e validação em todas as camadas

### Padrões de Código

- **TypeScript Strict**: Uso rigoroso de tipos
- **ES6+ Features**: Async/await, destructuring, etc.
- **Clean Code**: Funções pequenas, nomes descritivos
- **DRY Principle**: Não repetição de código
- **SOLID Principles**: Princípios de design orientado a objetos

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor com hot reload
npm start            # Inicia servidor em produção

# Build
npm run build        # Compila TypeScript para JavaScript

# Testes
npm test             # Executa todos os testes
npm run test:watch   # Executa testes em modo watch
npm run test:coverage # Executa testes com relatório de cobertura
```

## Variáveis de Ambiente

### Obrigatórias
- `PORT` - Porta do servidor (default: 3001)
- `MONGO_URI` - URI de conexão MongoDB
- `JWT_SECRET` - Chave secreta para JWT
- `GMAIL_ADDRESS` - Email Gmail para envio
- `GMAIL_APP_PASSWORD` - Senha de app Gmail
- `FRONTEND_DOMAIN` - URL do frontend

### Opcionais
- `CLOUDINARY_CLOUD_NAME` - Nome da nuvem Cloudinary
- `CLOUDINARY_API_KEY` - Chave API Cloudinary
- `CLOUDINARY_API_SECRET` - Segredo API Cloudinary

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Commit

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças na documentação
- `style:` - Mudanças de estilo (formatação, etc.)
- `refactor:` - Refatoração de código
- `test:` - Adição ou correção de testes
- `chore:` - Mudanças em ferramentas, config, etc.

## Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

## Suporte

Para suporte, entre em contato através das issues do GitHub ou envie um email para a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando Node.js, Express e TypeScript**