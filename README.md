# Car Marketplace API

This is a well-structured Express.js API, built with TypeScript, for a car marketplace. It provides endpoints for public car listings, search, user authentication, and authenticated vehicle management.

## Project Structure

```
├── src/
│   ├── config/             # Database configuration
│   │   └── database.ts
│   ├── controllers/        # Business logic for routes
│   │   ├── authController.ts
│   │   ├── carController.ts
│   │   └── userController.ts
│   ├── middleware/         # Express middleware (e.g., authentication)
│   │   └── authMiddleware.ts
│   ├── models/             # TypeScript interfaces for data structures
│   │   ├── Car.ts
│   │   └── User.ts
│   ├── routes/             # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── carRoutes.ts
│   │   └── userRoutes.ts
│   └── app.ts              # Main Express application file
├── .env.example            # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd pontocarro-API
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Database Setup (PostgreSQL)**:

    This application uses PostgreSQL. You'll need to provide your database connection details via environment variables. For local development, create a `.env` file in the project root based on `.env.example`.

    Example `.env` file:
    ```
    DB_HOST=localhost
    DB_USER=postgres
    DB_PASSWORD=password
    DB_NAME=car_marketplace
    DB_PORT=5432
    JWT_SECRET=your_super_secret_jwt_key_here
    ```

    *   `DB_HOST`: Your PostgreSQL host (e.g., `localhost` for local, or the host provided by Render).
    *   `DB_USER`: Your PostgreSQL username.
    *   `DB_PASSWORD`: Your PostgreSQL password.
    *   `DB_NAME`: The name of your database (e.g., `car_marketplace`).
    *   `DB_PORT`: The port for your PostgreSQL database (default is `5432`).
    *   `JWT_SECRET`: A strong, random string for JWT token signing.

    When deploying to Render, you will configure these environment variables directly in your Render project settings.

4.  **Run the server**:

    *   **Development Mode (with auto-reload)**:
        ```bash
        npm run dev
        ```

    *   **Production Mode (build and run)**:
        ```bash
        npm run build
        npm start
        ```

    The server will connect to the PostgreSQL database and automatically create the `users` and `cars` tables if they don't exist. It will then start on `http://localhost:3000`.

## API Endpoints

### Public Endpoints

*   **Get all cars**
    `GET /cars`
    ```bash
    curl http://localhost:3000/cars
    ```

*   **Search cars with filters**
    `GET /cars/search?make=Honda&model=Civic&year=2020&minPrice=10000&maxPrice=30000`
    ```bash
    curl http://localhost:3000/cars/search?make=Honda&model=Civic
    ```

### User Authentication Endpoints

*   **User Registration**
    `POST /auth/register`
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"username": "newuser", "email": "newuser@example.com", "password": "newpassword"}' http://localhost:3000/auth/register
    ```
    *   Returns a JWT token upon successful registration.

*   **User Login**
    `POST /auth/login`
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"email": "newuser@example.com", "password": "newpassword"}' http://localhost:3000/auth/login
    ```
    *   Returns a JWT token upon successful login.

*   **Forgot Password**
    `POST /auth/forgot-password`
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"email": "user@example.com"}' http://localhost:3000/auth/forgot-password
    ```

### Authenticated Endpoints (Requires JWT in `Authorization` header)

To access these endpoints, include the JWT token obtained from login/registration in the `Authorization` header as `Bearer <token>`.

Example (replace `<your_jwt_token>` with the actual token):
```bash
Authorization: Bearer <your_jwt_token>
```

*   **Edit User Profile**
    `PUT /user/profile`
    ```bash
    curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <your_jwt_token>" -d '{"username": "updateduser", "email": "updated@example.com"}' http://localhost:3000/user/profile
    ```

*   **Publish New Vehicle**
    `POST /user/vehicles`
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <your_jwt_token>" -d '{"make": "Toyota", "model": "Camry", "year": 2020, "price": 22000, "description": "Low mileage, well-maintained."}' http://localhost:3000/user/vehicles
    ```

*   **Edit Vehicle**
    `PUT /user/vehicles/:id`
    (Replace `:id` with a vehicle ID)
    ```bash
    curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <your_jwt_token>" -d '{"price": 25000}' http://localhost:3000/user/vehicles/1
    ```

*   **Delete Vehicle**
    `DELETE /user/vehicles/:id`
    (Replace `:id` with a vehicle ID)
    ```bash
    curl -X DELETE -H "Authorization: Bearer <your_jwt_token>" http://localhost:3000/user/vehicles/1
    ```
