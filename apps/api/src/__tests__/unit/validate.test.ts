import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { validate, validateBody } from '@/middleware/validate.middleware';
import { AppError } from '@/utils/app-error';

// Minimal request/response/next mocks
const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({ body: {}, query: {}, params: {}, ...overrides } as Request);

const makeRes = (): Response => ({} as Response);

const makeNext = () => vi.fn() as unknown as NextFunction;

describe('validate middleware', () => {
  describe('body validation', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
    });

    it('calls next() with no args when body is valid', async () => {
      const req = makeReq({ body: { name: 'Alice', age: 30 } });
      const next = makeNext();

      await validate({ body: schema })(req, makeRes(), next);

      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith(); // no error arg
    });

    it('replaces req.body with the parsed (coerced) value', async () => {
      const coercingSchema = z.object({ count: z.coerce.number() });
      const req = makeReq({ body: { count: '5' } });
      const next = makeNext();

      await validate({ body: coercingSchema })(req, makeRes(), next);

      expect(req.body.count).toBe(5); // string coerced to number
    });

    it('calls next(AppError) with VALIDATION_ERROR when body is invalid', async () => {
      const req = makeReq({ body: { name: '', age: -1 } });
      const next = makeNext();

      await validate({ body: schema })(req, makeRes(), next);

      expect(next).toHaveBeenCalledOnce();
      const [error] = (next as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(400);
      expect((error as AppError).code).toBe('VALIDATION_ERROR');
    });

    it('includes field path in the error message', async () => {
      const req = makeReq({ body: {} }); // missing both fields
      const next = makeNext();

      await validate({ body: schema })(req, makeRes(), next);

      const [error] = (next as ReturnType<typeof vi.fn>).mock.calls[0];
      expect((error as AppError).message).toContain('Validation failed');
    });
  });

  describe('query validation', () => {
    const querySchema = z.object({
      page: z.coerce.number().positive().default(1),
    });

    it('validates and coerces query params', async () => {
      const req = makeReq({ query: { page: '3' } as never });
      const next = makeNext();

      await validate({ query: querySchema })(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect((req.query as { page: number }).page).toBe(3);
    });

    it('fails when query param is invalid', async () => {
      const req = makeReq({ query: { page: 'abc' } as never });
      const next = makeNext();

      await validate({ query: querySchema })(req, makeRes(), next);

      const [error] = (next as ReturnType<typeof vi.fn>).mock.calls[0];
      expect((error as AppError).statusCode).toBe(400);
    });
  });

  describe('params validation', () => {
    const paramsSchema = z.object({ id: z.string().uuid() });

    it('passes valid UUID params', async () => {
      const req = makeReq({ params: { id: '123e4567-e89b-12d3-a456-426614174000' } });
      const next = makeNext();

      await validate({ params: paramsSchema })(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith();
    });

    it('rejects non-UUID id param', async () => {
      const req = makeReq({ params: { id: 'not-a-uuid' } });
      const next = makeNext();

      await validate({ params: paramsSchema })(req, makeRes(), next);

      const [error] = (next as ReturnType<typeof vi.fn>).mock.calls[0];
      expect((error as AppError).code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateBody shorthand', () => {
    it('behaves the same as validate({ body: schema })', async () => {
      const schema = z.object({ title: z.string() });
      const req = makeReq({ body: { title: 'hello' } });
      const next = makeNext();

      await validateBody(schema)(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
