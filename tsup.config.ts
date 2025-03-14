import {defineConfig} from 'tsup';

export default defineConfig({
    entry: ['src/**/*.ts'],
    dts: true,
    clean: true,
    sourcemap: true,
    outDir: 'build',
    splitting: false,
    bundle: false,
    format: ['cjs', 'esm'],
});
