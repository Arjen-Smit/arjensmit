import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { createApp } from './app.ts';
import { type AppConfig, DEFAULT_BASE_PATH } from './config.ts';

export interface TestServer {
  readonly baseUrl: string;
  close(): Promise<void>;
}

export const TEST_DATA_DIR = path.resolve(import.meta.dirname, '..', 'data');

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return { port: 0, basePath: DEFAULT_BASE_PATH, dataDir: TEST_DATA_DIR, mode: 'test', ...overrides };
}

/** Starts the app on a random free port so tests exercise the real HTTP stack. */
export function startTestServer(config: AppConfig = testConfig()): Promise<TestServer> {
  return new Promise((resolve, reject) => {
    const server: Server = createApp(config).listen(0);
    server.once('error', reject);
    server.once('listening', () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((done, fail) => server.close((error) => (error ? fail(error) : done()))),
      });
    });
  });
}
