import { Router } from 'express';
import type { AppConfig } from '../config.ts';

const startedAt = new Date().toISOString();

/** Runtime facts that prove which Node the host is really running. Deliberately no paths or hostnames. */
export function infoRouter(config: AppConfig): Router {
  const router = Router();
  router.get('/info', (_req, res) => {
    res.json({
      name: 'arjensmit-api',
      mode: config.mode,
      basePath: config.basePath || '/',
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      startedAt,
    });
  });
  return router;
}
