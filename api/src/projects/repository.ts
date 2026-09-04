import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PROJECTS_FILE = 'projects.json';

export interface Project {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly url?: string;
  readonly tags: readonly string[];
}

/** Reads the project list from disk on every call: the data is tiny and this keeps edits on the server live. */
export async function loadProjects(dataDir: string): Promise<Project[]> {
  const raw = await readFile(path.join(dataDir, PROJECTS_FILE), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${PROJECTS_FILE} must contain a JSON array`);
  }
  return parsed.map(assertProject);
}

export async function findProject(dataDir: string, slug: string): Promise<Project | undefined> {
  const projects = await loadProjects(dataDir);
  return projects.find((project) => project.slug === slug);
}

function assertProject(value: unknown): Project {
  if (!isProject(value)) {
    throw new Error(`${PROJECTS_FILE} contains an entry that is not a valid project`);
  }
  return value;
}

function isProject(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.slug === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    (candidate.url === undefined || typeof candidate.url === 'string') &&
    Array.isArray(candidate.tags) &&
    candidate.tags.every((tag) => typeof tag === 'string')
  );
}
