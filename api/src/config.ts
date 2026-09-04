import path from 'node:path';

export const DEFAULT_PORT = 3000;
export const DEFAULT_BASE_PATH = '/api';
const MAX_PORT = 65535;

/** Both `src/` and the compiled `dist/` sit one level below the project root. */
const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');

export interface AppConfig {
  readonly port: number;
  /** Public URL prefix under which Passenger mounts the app, e.g. `/api`. Empty string for the domain root. */
  readonly basePath: string;
  readonly dataDir: string;
  readonly mode: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: parsePort(env.PORT),
    basePath: normalizeBasePath(env.BASE_PATH ?? DEFAULT_BASE_PATH),
    dataDir: env.DATA_DIR ?? path.join(PROJECT_ROOT, 'data'),
    mode: env.NODE_ENV ?? 'development',
  };
}

/**
 * Passenger overrides `listen()` and ignores the port we pass, so an unusable PORT value
 * must never crash the process. Fall back to the default instead.
 */
export function parsePort(raw: string | undefined): number {
  const port = Number(raw);
  const isValid = raw !== undefined && raw !== '' && Number.isInteger(port) && port >= 0 && port <= MAX_PORT;
  return isValid ? port : DEFAULT_PORT;
}

/** Normalises `api`, `/api/`, ` /api ` to `/api`; an empty value means "no prefix". */
export function normalizeBasePath(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed === '') {
    return '';
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
