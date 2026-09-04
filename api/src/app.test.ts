import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestServer, testConfig, type TestServer } from './test-helpers.ts';

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

/** Loose shape of the JSON bodies the API returns; tests assert the specific fields they care about. */
interface JsonBody {
  readonly [key: string]: unknown;
  readonly count?: number;
  readonly items?: ReadonlyArray<{ readonly slug: string }>;
}

describe('arjensmit-api', () => {
  let server: TestServer;

  before(async () => {
    server = await startTestServer(testConfig());
  });
  after(() => server.close());

  const getJson = async (path: string) => {
    const response = await fetch(`${server.baseUrl}${path}`);
    return { status: response.status, body: (await response.json()) as JsonBody };
  };

  it('answers the health check with and without the Passenger base path', async () => {
    const direct = await getJson('/health');
    const prefixed = await getJson('/api/health');
    assert.equal(direct.status, HTTP_OK);
    assert.equal(prefixed.status, HTTP_OK);
    assert.equal(direct.body.status, 'ok');
    assert.equal(prefixed.body.status, 'ok');
  });

  it('does not treat a path that merely starts with the prefix text as prefixed', async () => {
    const response = await getJson('/apihealth');
    assert.equal(response.status, HTTP_NOT_FOUND);
    assert.equal(response.body.path, '/apihealth');
  });

  it('reports runtime info without leaking server paths', async () => {
    const { status, body } = await getJson('/v1/info');
    assert.equal(status, HTTP_OK);
    assert.equal(body.node, process.version);
    assert.equal(body.basePath, '/api');
    assert.equal(JSON.stringify(body).includes('/Users'), false);
  });

  it('lists projects read from the data directory', async () => {
    const { status, body } = await getJson('/v1/projects');
    assert.equal(status, HTTP_OK);
    assert.ok(Number(body.count) > 0);
    assert.equal(body.items?.length, body.count);
    assert.equal(typeof body.items?.[0]?.slug, 'string');
  });

  it('returns a single project by slug and 404 for an unknown one', async () => {
    const found = await getJson('/v1/projects/arjensmit-nl');
    const missing = await getJson('/v1/projects/does-not-exist');
    assert.equal(found.status, HTTP_OK);
    assert.equal(found.body.slug, 'arjensmit-nl');
    assert.equal(missing.status, HTTP_NOT_FOUND);
    assert.deepEqual(missing.body, { error: 'Project not found' });
  });

  it('greets a valid name and rejects an invalid one', async () => {
    const ok = await getJson('/v1/greetings/Arjen');
    const bad = await getJson(`/v1/greetings/${encodeURIComponent('<script>')}`);
    assert.equal(ok.status, HTTP_OK);
    assert.equal(ok.body.greeting, 'Hallo Arjen!');
    assert.equal(bad.status, HTTP_BAD_REQUEST);
    assert.ok(typeof bad.body.error === 'string');
  });

  it('returns JSON for unknown routes', async () => {
    const { status, body } = await getJson('/nope');
    assert.equal(status, HTTP_NOT_FOUND);
    assert.equal(body.error, 'Not found');
  });
});
