// @ts-check
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      // The offline copy (npm run release:offline): a copy of dist/ and the launchers.
      'release/**',
      // An unzipped dev kit's npm cache, engine, model and browser (scripts/build-dev-kit.mjs).
      'offline/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'public/engine/**',
      'public/maia/**',
      'dev-dist/**',
      'scripts/lib/*.d.mts',
      'relay/src/**/*.d.mts',
      '**/.wrangler/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.js', '*.mjs', 'scripts/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // The project bans `!` assertions (see below), so don't suggest them.
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
  // Browser application code
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The compiler-derived rules flag the "latest value in a ref" and
      // "kick off async work in an effect" patterns that the board/engine hooks
      // rely on to wrap imperative libraries (chessground, the UCI worker).
      // Those patterns are deliberate and reviewed; the classic hook rules stay on.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'smart'],
      curly: ['error', 'multi-line'],
    },
  },
  // Node-side code: build config, scripts, e2e
  {
    files: [
      'vite.config.ts',
      'playwright.config.ts',
      'e2e/**/*.ts',
      'scripts/**/*.mjs',
      'scripts/**/*.ts',
      'relay/**/*.mjs',
      'relay/**/*.ts',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Plain JS files can't carry type information
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  // Router configuration legitimately exports both components and helpers.
  {
    files: ['src/app/routes.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // Tests
  {
    files: [
      'src/**/*.test.{ts,tsx}',
      'src/test/**/*.ts',
      'scripts/**/*.test.ts',
      'relay/**/*.test.ts',
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
