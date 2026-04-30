import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const eslintConfig = defineConfig([
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['functions/**/*.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    '.next-dev/**',
    '.vercel/**',
    '.wrangler/**',
    'dist/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
