import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';
import tempDir from 'temp-dir';
import { uglify } from "rollup-plugin-uglify";

// rollup.config.js
export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/croct-sdk.js',
        name: 'croct',
        format: 'iife',
        sourcemap: true,
    },
    treeshake: {
        propertyReadSideEffects: false
    },
    plugins: [
        resolve(),
        typescript({cacheRoot: `${tempDir}/.rpt2_cache`}),
        replace({
            delimiters: ['', ''],
            values: {
                '(function (ReplayerEvents)' : '/*@__PURE__*/ (function (ReplayerEvents)',
                'createCommonjsModule' : '/*@__PURE__*/ createCommonjsModule',
            },
        }),
        uglify({
            compress: {
                unused: true,
                dead_code: true,
            },
            mangle: {
                properties: {
                    regex: /rrweb/i
                }
            }
        })
    ]
};