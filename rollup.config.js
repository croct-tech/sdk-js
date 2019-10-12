import resolve from 'rollup-plugin-node-resolve';
import replace from "rollup-plugin-replace";
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import {uglify} from "rollup-plugin-uglify";

// rollup.config.js
export default commandLineArgs => {
    return {
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
            replace({
                delimiters: ['<@', '@>'],
                beaconVersion: commandLineArgs['config-beacon-version'] || '1.0.0',
                websocketEndpoint: commandLineArgs['config-websocket-endpoint'] || 'ws://localhost:8443/connect/',
                evaluationEndpoint: commandLineArgs['config-evaluation-endpoint'] || 'http://localhost:8000/',
            }),
            typescript({cacheRoot: `${tempDir}/.rpt2_cache`}),
            /*uglify({
                compress: {
                    unused: true,
                    dead_code: true,
                }
            })*/
        ]
    };
};