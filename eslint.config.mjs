import expoConfig from 'eslint-config-expo/flat.js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { configs as tseslintConfigs } from 'typescript-eslint';

export default [
  // Expo's recommended config for flat config
  ...expoConfig,

  // TypeScript ESLint recommended configs
  ...tseslintConfigs.recommended,
  ...tseslintConfigs.stylistic,

  // Prettier integration (must be last)
  eslintPluginPrettierRecommended,

  // Custom rules
  {
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // React/React Native rules
      'react/prop-types': 'off', // We use TypeScript
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General rules
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',

      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },

  // Files to ignore
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'ios/**',
      'android/**',
      '*.config.js',
      '*.config.ts',
      'babel.config.js',
      'metro.config.js',
      'apply-migration.js',
      'apply-migration-002.js',
      'run-migration.js',
      'check-database.js',
    ],
  },
];
