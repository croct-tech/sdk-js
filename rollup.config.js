import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-re';
import tempDir from 'temp-dir';
//import { uglify } from "rollup-plugin-uglify";

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
            patterns: [
                {
                    match: /(?=\(function \(ReplayerEvents)/g,
                    replace: "\/*@__PURE__*\/",
                },
                {
                    match: /(?=createCommonjsModule\()/g,
                    replace: "\/*@__PURE__*\/",
                }
            ]
        })
        //uglify({compress: {unused: true, dead_code: true}})
    ]
};