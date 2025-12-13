// Configurações globais para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.MONGO_URI = 'mongodb://localhost:27017/pontocarro_test';
process.env.GMAIL_ADDRESS = 'test@example.com';
process.env.GMAIL_APP_PASSWORD = 'test_password';
process.env.FRONTEND_DOMAIN = 'http://localhost:3000';
process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
process.env.CLOUDINARY_API_KEY = 'test_api_key';
process.env.CLOUDINARY_API_SECRET = 'test_api_secret';

// Mock do mongoose para evitar conexões reais com MongoDB
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
    on: jest.fn(),
    once: jest.fn(),
  },
  Schema: jest.fn(),
  model: jest.fn(),
}));

// Mock do nodemailer para evitar envio de emails reais durante os testes
jest.mock('../src/config/email', () => ({
  sendMail: jest.fn().mockResolvedValue(true),
}));

// Mock do cloudinary para evitar uploads reais durante os testes
jest.mock('../src/config/cloudinary', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      public_id: 'test_public_id',
      secure_url: 'https://test.cloudinary.com/test.jpg',
    }),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
  api: {
    delete_resources_by_prefix: jest.fn().mockResolvedValue({}),
    delete_folder: jest.fn().mockResolvedValue({}),
  },
}));