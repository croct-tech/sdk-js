import { defineConfig } from 'eslint/config';
import { configs } from '@croct/eslint-plugin';

export default defineConfig(
    configs.typescript,
    {
        ignores: [
            'build/**',
            'node_modules/**',
        ],
    },
    {
        rules: {
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
        },
    },
    {
        files: ['test/**/*.ts'],
        languageOptions: {
            parserOptions: {
                projectService: false,
                project: './test/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
