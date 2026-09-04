import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logError } from './logger.ts';

export const HTTP_BAD_REQUEST = 400;
export const HTTP_NOT_FOUND = 404;
export const HTTP_INTERNAL_ERROR = 500;

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(HTTP_NOT_FOUND).json({ error: 'Not found', path: req.path });
};

/** Express identifies error middleware by arity, so all four parameters must stay. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logError('Unhandled error', error);
  res.status(HTTP_INTERNAL_ERROR).json({ error: 'Internal server error' });
};
