export function logError(message: string, error: unknown): void {
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error(`[arjensmit-api] ${message}: ${detail}`);
}

export function logInfo(message: string): void {
  console.log(`[arjensmit-api] ${message}`);
}
