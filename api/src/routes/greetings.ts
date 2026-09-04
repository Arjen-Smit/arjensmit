import { Router } from 'express';
import { HTTP_BAD_REQUEST, HttpError } from '../http-errors.ts';

/** Letters (any script), combining marks, spaces, hyphens and apostrophes; 1 to 40 characters. */
const NAME_PATTERN = /^[\p{L}\p{M}' -]{1,40}$/u;

export function greetingsRouter(): Router {
  const router = Router();
  router.get('/greetings/:name', (req, res) => {
    const name = req.params.name;
    if (!NAME_PATTERN.test(name)) {
      throw new HttpError(HTTP_BAD_REQUEST, 'name must be 1-40 letters, spaces, hyphens or apostrophes');
    }
    res.json({ greeting: `Hallo ${name.trim()}!` });
  });
  return router;
}
