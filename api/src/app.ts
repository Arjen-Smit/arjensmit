import express, { type Express } from 'express';
import type { AppConfig } from './config.ts';
import { errorHandler, notFoundHandler } from './http-errors.ts';
import { stripBasePath } from './middleware/base-path.ts';
import { greetingsRouter } from './routes/greetings.ts';
import { healthRouter } from './routes/health.ts';
import { infoRouter } from './routes/info.ts';
import { projectsRouter } from './routes/projects.ts';

const JSON_BODY_LIMIT = '10kb';

export function createApp(config: AppConfig): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(stripBasePath(config.basePath));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use(healthRouter());
  app.use('/v1', infoRouter(config), projectsRouter(config), greetingsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
