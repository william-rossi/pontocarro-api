import { createUserSchema } from '../src/schemas/userSchema';

describe('Validation Schemas', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '11987654321',
        city: 'São Paulo',
        state: 'SP',
      };

      expect(() => {
        createUserSchema.parse(validData);
      }).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123!',
        phone: '11987654321',
        city: 'São Paulo',
        state: 'SP',
      };

      expect(() => {
        createUserSchema.parse(invalidData);
      }).toThrow();
    });

    it('should reject weak password', () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        phone: '11987654321',
        city: 'São Paulo',
        state: 'SP',
      };

      expect(() => {
        createUserSchema.parse(invalidData);
      }).toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        username: 'testuser',
        // email missing
        password: 'Password123!',
      };

      expect(() => {
        createUserSchema.parse(invalidData);
      }).toThrow();
    });
  });
});

describe('Utility Functions', () => {
  it('should validate JWT secret exists', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(typeof process.env.JWT_SECRET).toBe('string');
    expect(process.env.JWT_SECRET!.length).toBeGreaterThan(0);
  });

  it('should validate environment is test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});