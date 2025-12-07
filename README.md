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