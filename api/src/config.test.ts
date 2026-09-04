import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_PORT, loadConfig, normalizeBasePath, parsePort } from './config.ts';

describe('normalizeBasePath', () => {
  it('adds a leading slash and strips trailing slashes and whitespace', () => {
    assert.equal(normalizeBasePath('api'), '/api');
    assert.equal(normalizeBasePath('/api/'), '/api');
    assert.equal(normalizeBasePath(' /api// '), '/api');
  });

  it('treats an empty or slash-only value as "no prefix"', () => {
    assert.equal(normalizeBasePath(''), '');
    assert.equal(normalizeBasePath('/'), '');
  });
});

describe('parsePort', () => {
  it('accepts valid ports', () => {
    assert.equal(parsePort('8080'), 8080);
    assert.equal(parsePort('0'), 0);
  });

  it('falls back to the default for missing or unusable values', () => {
    assert.equal(parsePort(undefined), DEFAULT_PORT);
    assert.equal(parsePort(''), DEFAULT_PORT);
    assert.equal(parsePort('/tmp/passenger.sock'), DEFAULT_PORT);
    assert.equal(parsePort('70000'), DEFAULT_PORT);
  });
});

describe('loadConfig', () => {
  it('reads values from the given environment', () => {
    const config = loadConfig({ PORT: '4000', BASE_PATH: 'v2', DATA_DIR: '/srv/data', NODE_ENV: 'production' });
    assert.deepEqual(config, { port: 4000, basePath: '/v2', dataDir: '/srv/data', mode: 'production' });
  });
});
