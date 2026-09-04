import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { findProject, loadProjects } from './repository.ts';

async function writeProjectsFile(dir: string, content: unknown): Promise<void> {
  await writeFile(path.join(dir, 'projects.json'), JSON.stringify(content), 'utf8');
}

describe('projects repository', () => {
  let dataDir: string;

  before(async () => {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'arjensmit-api-'));
  });
  after(() => rm(dataDir, { recursive: true, force: true }));

  it('loads valid projects and finds one by slug', async () => {
    await writeProjectsFile(dataDir, [{ slug: 'a', title: 'A', summary: 'first', tags: ['x'] }]);
    const projects = await loadProjects(dataDir);
    assert.equal(projects.length, 1);
    assert.equal((await findProject(dataDir, 'a'))?.title, 'A');
    assert.equal(await findProject(dataDir, 'b'), undefined);
  });

  it('rejects a file whose root is not an array', async () => {
    await writeProjectsFile(dataDir, { slug: 'a' });
    await assert.rejects(loadProjects(dataDir), /must contain a JSON array/);
  });

  it('rejects entries with missing or wrongly typed fields', async () => {
    await writeProjectsFile(dataDir, [{ slug: 'a', title: 'A', summary: 'first', tags: [1] }]);
    await assert.rejects(loadProjects(dataDir), /not a valid project/);
  });

  it('fails when the data file is missing', async () => {
    await assert.rejects(loadProjects(path.join(dataDir, 'missing')), { code: 'ENOENT' });
  });
});
