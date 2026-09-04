import { Router } from 'express';
import type { AppConfig } from '../config.ts';
import { HTTP_NOT_FOUND, HttpError } from '../http-errors.ts';
import { findProject, loadProjects } from '../projects/repository.ts';

export function projectsRouter(config: AppConfig): Router {
  const router = Router();

  router.get('/projects', async (_req, res) => {
    const items = await loadProjects(config.dataDir);
    res.json({ count: items.length, items });
  });

  router.get('/projects/:slug', async (req, res) => {
    const project = await findProject(config.dataDir, req.params.slug);
    if (project === undefined) {
      throw new HttpError(HTTP_NOT_FOUND, 'Project not found');
    }
    res.json(project);
  });

  return router;
}
