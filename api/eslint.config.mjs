import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'app.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // The process entry point and the logger are the only places that may write to stdout/stderr.
    files: ['src/server.ts', 'src/logger.ts'],
    rules: { 'no-console': 'off' },
  },
);
