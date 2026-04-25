import { describe, it, expect } from 'vitest';
import { AppError } from '@/utils/app-error';

describe('AppError', () => {
  describe('constructor', () => {
    it('sets all properties correctly', () => {
      const err = new AppError('Something went wrong', 400, 'BAD_INPUT');

      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_INPUT');
      expect(err.isOperational).toBe(true);
    });

    it('uses defaults when optional params are omitted', () => {
      const err = new AppError('Unexpected failure');

      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
      expect(err.isOperational).toBe(true);
    });

    it('is an instance of Error', () => {
      const err = new AppError('test');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it('has a stack trace', () => {
      const err = new AppError('test');
      expect(err.stack).toBeDefined();
    });
  });

  describe('AppError.badRequest', () => {
    it('returns 400 with BAD_REQUEST code by default', () => {
      const err = AppError.badRequest('Invalid input');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.message).toBe('Invalid input');
    });

    it('accepts a custom code', () => {
      const err = AppError.badRequest('Invalid email', 'INVALID_EMAIL');
      expect(err.code).toBe('INVALID_EMAIL');
    });
  });

  describe('AppError.unauthorized', () => {
    it('returns 401 with UNAUTHORIZED code', () => {
      const err = AppError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    });

    it('uses default message when none provided', () => {
      const err = AppError.unauthorized();
      expect(err.message).toBe('Unauthorized');
    });

    it('accepts a custom message and code', () => {
      const err = AppError.unauthorized('Token expired', 'TOKEN_EXPIRED');
      expect(err.message).toBe('Token expired');
      expect(err.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('AppError.forbidden', () => {
    it('returns 403 with FORBIDDEN code', () => {
      const err = AppError.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });

    it('accepts custom message and code', () => {
      const err = AppError.forbidden('Admin only', 'ADMIN_REQUIRED');
      expect(err.message).toBe('Admin only');
      expect(err.code).toBe('ADMIN_REQUIRED');
    });
  });

  describe('AppError.notFound', () => {
    it('returns 404 with NOT_FOUND code', () => {
      const err = AppError.notFound();
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
    });

    it('accepts a custom resource message', () => {
      const err = AppError.notFound('Client not found', 'CLIENT_NOT_FOUND');
      expect(err.message).toBe('Client not found');
      expect(err.code).toBe('CLIENT_NOT_FOUND');
    });
  });

  describe('AppError.conflict', () => {
    it('returns 409 with CONFLICT code', () => {
      const err = AppError.conflict('Duplicate phone number');
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });

    it('accepts a custom code', () => {
      const err = AppError.conflict('Phone taken', 'PHONE_EXISTS');
      expect(err.code).toBe('PHONE_EXISTS');
    });
  });

  describe('AppError.tooManyRequests', () => {
    it('returns 429 with RATE_LIMITED code', () => {
      const err = AppError.tooManyRequests();
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('RATE_LIMITED');
    });
  });

  describe('AppError.internal', () => {
    it('returns 500 with INTERNAL_ERROR code', () => {
      const err = AppError.internal();
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
    });

    it('marks isOperational as false', () => {
      const err = AppError.internal('DB crashed');
      expect(err.isOperational).toBe(false);
    });
  });
});
