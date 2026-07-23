import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before importing the service
vi.mock('../db/index.js', () => ({
  query: vi.fn(),
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(),
  },
}));

import { register, login, verifyToken } from './auth.service.js';
import { query } from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiErrorCode } from '../models/index.js';

const mockQuery = vi.mocked(query);
const mockBcryptHash = vi.mocked(bcrypt.hash);
const mockBcryptCompare = vi.mocked(bcrypt.compare);
const mockJwtSign = vi.mocked(jwt.sign);
const mockJwtVerify = vi.mocked(jwt.verify);

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    const validInput = {
      nombre: 'María García',
      escuela: 'Jardín Nº 5',
      email: 'maria@test.com',
      password: 'password123',
    };

    it('should register a user with valid input', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // email check
      mockBcryptHash.mockResolvedValueOnce('hashed_password' as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-1', nombre: 'María García', escuela: 'Jardín Nº 5', email: 'maria@test.com' }],
        rowCount: 1,
      } as any); // insert

      const result = await register(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.nombre).toBe('María García');
        expect(result.data.user.email).toBe('maria@test.com');
        expect(result.data.token).toBe('mock-jwt-token');
      }
    });

    it('should return VALIDATION_ERROR when nombre is empty', async () => {
      const result = await register({ ...validInput, nombre: '' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        expect((result.error as any).details.nombre).toBeDefined();
      }
    });

    it('should return VALIDATION_ERROR when nombre exceeds 100 characters', async () => {
      const result = await register({ ...validInput, nombre: 'a'.repeat(101) });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        expect((result.error as any).details.nombre).toContain('100');
      }
    });

    it('should return VALIDATION_ERROR when escuela exceeds 150 characters', async () => {
      const result = await register({ ...validInput, escuela: 'a'.repeat(151) });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        expect((result.error as any).details.escuela).toContain('150');
      }
    });

    it('should return VALIDATION_ERROR when email exceeds 254 characters', async () => {
      const result = await register({ ...validInput, email: 'a'.repeat(246) + '@test.com' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        expect((result.error as any).details.email).toBeDefined();
      }
    });

    it('should return VALIDATION_ERROR when email format is invalid', async () => {
      const result = await register({ ...validInput, email: 'not-an-email' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        expect((result.error as any).details.email).toContain('formato');
      }
    });

    it('should return VALIDATION_ERROR when password is shorter than 6 chars', async () => {
      const result = await register({ ...validInput, password: '12345' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        expect((result.error as any).details.password).toContain('6');
      }
    });

    it('should return VALIDATION_ERROR when password exceeds 72 chars', async () => {
      const result = await register({ ...validInput, password: 'a'.repeat(73) });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        expect((result.error as any).details.password).toContain('72');
      }
    });

    it('should return CONFLICT when email already exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }], rowCount: 1 } as any);

      const result = await register(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.CONFLICT);
      }
    });

    it('should normalize email to lowercase', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      mockBcryptHash.mockResolvedValueOnce('hashed_password' as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-1', nombre: 'María García', escuela: 'Jardín Nº 5', email: 'maria@test.com' }],
        rowCount: 1,
      } as any);

      await register({ ...validInput, email: 'MARIA@TEST.COM' });

      // Check the email passed to the INSERT query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM usuario'),
        ['maria@test.com']
      );
    });

    it('should trim whitespace from nombre and escuela', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      mockBcryptHash.mockResolvedValueOnce('hashed_password' as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-1', nombre: 'María García', escuela: 'Jardín Nº 5', email: 'maria@test.com' }],
        rowCount: 1,
      } as any);

      await register({ ...validInput, nombre: '  María García  ', escuela: '  Jardín Nº 5  ' });

      // Check the INSERT query was called with trimmed values
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuario'),
        ['María García', 'Jardín Nº 5', 'maria@test.com', 'hashed_password']
      );
    });
  });

  describe('login', () => {
    const validInput = { email: 'maria@test.com', password: 'password123' };

    it('should login with valid credentials', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-1', nombre: 'María', escuela: 'Jardín', email: 'maria@test.com', password_hash: 'hashed' }],
        rowCount: 1,
      } as any);
      mockBcryptCompare.mockResolvedValueOnce(true as never);

      const result = await login(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe('maria@test.com');
        expect(result.data.token).toBe('mock-jwt-token');
      }
    });

    it('should return UNAUTHORIZED with generic message when email not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await login(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
        expect(result.error.message).toBe('Credenciales inválidas');
      }
    });

    it('should return UNAUTHORIZED with generic message when password is wrong', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-1', nombre: 'María', escuela: 'Jardín', email: 'maria@test.com', password_hash: 'hashed' }],
        rowCount: 1,
      } as any);
      mockBcryptCompare.mockResolvedValueOnce(false as never);

      const result = await login(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
        expect(result.error.message).toBe('Credenciales inválidas');
      }
    });

    it('should return same error message for non-existent email and wrong password', async () => {
      // Non-existent email
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const resultNoEmail = await login(validInput);

      // Wrong password
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-1', nombre: 'María', escuela: 'Jardín', email: 'maria@test.com', password_hash: 'hashed' }],
        rowCount: 1,
      } as any);
      mockBcryptCompare.mockResolvedValueOnce(false as never);
      const resultWrongPass = await login(validInput);

      // Both should have identical error structure
      expect(resultNoEmail.success).toBe(false);
      expect(resultWrongPass.success).toBe(false);
      if (!resultNoEmail.success && !resultWrongPass.success) {
        expect(resultNoEmail.error.message).toBe(resultWrongPass.error.message);
        expect(resultNoEmail.error.code).toBe(resultWrongPass.error.code);
      }
    });

    it('should return VALIDATION_ERROR when email is empty', async () => {
      const result = await login({ email: '', password: 'password123' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
      }
    });

    it('should return VALIDATION_ERROR when password is empty', async () => {
      const result = await login({ email: 'test@test.com', password: '' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
      }
    });
  });

  describe('verifyToken', () => {
    it('should return user data for a valid token', async () => {
      mockJwtVerify.mockReturnValueOnce({ userId: 'uuid-1', email: 'maria@test.com' } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-1', nombre: 'María', escuela: 'Jardín', email: 'maria@test.com' }],
        rowCount: 1,
      } as any);

      const result = await verifyToken('valid-token');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('uuid-1');
        expect(result.data.email).toBe('maria@test.com');
      }
    });

    it('should return UNAUTHORIZED for an invalid token', async () => {
      mockJwtVerify.mockImplementationOnce(() => {
        throw new Error('invalid token');
      });

      const result = await verifyToken('invalid-token');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
      }
    });

    it('should return UNAUTHORIZED when user no longer exists', async () => {
      mockJwtVerify.mockReturnValueOnce({ userId: 'deleted-user', email: 'gone@test.com' } as any);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await verifyToken('token-for-deleted-user');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
      }
    });
  });
});
