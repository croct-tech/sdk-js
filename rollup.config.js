import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import { uglify } from "rollup-plugin-uglify";
import commonjs from 'rollup-plugin-commonjs';

// rollup.config.js
export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/croct-sdk.js',
        name: 'croct',
        format: 'iife',
        sourceMap: true,
    },
    treeshake: {
        propertyReadSideEffects: false
    },
    plugins: [
        resolve(),
        commonjs({
            include: ['node_modules/**', 'validation/**'],
        }),
        typescript({cacheRoot: `${tempDir}/.rpt2_cache`}),
        uglify({
            compress: {
                unused: true,
                dead_code: true,
            }
        })
    ]
};