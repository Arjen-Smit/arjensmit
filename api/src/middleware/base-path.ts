import type { RequestHandler } from 'express';

/**
 * Passenger forwards the full request path including the "Application URL" prefix
 * (`/api/health`), while locally the app is reached without it (`/health`).
 * Removing the prefix when present lets every route be defined once, prefix-free.
 */
export function stripBasePath(basePath: string): RequestHandler {
  return (req, _res, next) => {
    if (hasPrefix(req.url, basePath)) {
      req.url = req.url.slice(basePath.length) || '/';
    }
    next();
  };
}

function hasPrefix(url: string, basePath: string): boolean {
  if (basePath === '') {
    return false;
  }
  if (url === basePath) {
    return true;
  }
  const nextChar = url.charAt(basePath.length);
  return url.startsWith(basePath) && (nextChar === '/' || nextChar === '?');
}
