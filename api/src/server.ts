import { createApp } from './app.ts';
import { loadConfig } from './config.ts';
import { logInfo } from './logger.ts';

const config = loadConfig();
const server = createApp(config).listen(config.port, () => {
  logInfo(`listening on port ${config.port}, base path "${config.basePath || '/'}", mode ${config.mode}`);
});

function shutdown(signal: string): void {
  logInfo(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
