import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import dts from 'rollup-plugin-dts';
import {version} from "./package.json";

// rollup.config.js
export default args => {
    return [
        {
            input: 'src/index.ts',
            output: {
                file: 'build/index.js',
                format: 'commonjs',
                sourcemap: true,
            },
            treeshake: {
                propertyReadSideEffects: false,
            },
            plugins: [
                resolve(),
                replace({
                    delimiters: ['<@', '@>'],
                    version: version || 'unknown',
                    trackerEndpointUrl: args['config-tracker-endpoint'] || 'ws://localhost:8080/connect',
                    evaluationEndpointUrl: args['config-evaluation-endpoint'] || 'http://localhost:8000/evaluate',
                    bootstrapEndpointUrl: args['config-bootstrap-endpoint'] || 'http://localhost:8000/bootstrap',
                    maxExpressionLength: args['config-max-expression-length'] || '300',
                }),
                typescript({
                    cacheRoot: `${tempDir}/.rpt2_cache`,
                    useTsconfigDeclarationDir: true
                })
            ]
        },
        {
            input: './build/declarations/index.d.ts',
            output: [{file: 'build/index.d.ts', format: 'es'}],
            plugins: [dts()],
        },
    ];
};
