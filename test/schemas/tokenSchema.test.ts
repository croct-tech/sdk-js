import {tokenSchema} from '../../src/schema';

describe('The token schema', () => {
    test.each([
        [{
            headers: {
                typ: 'JWT',
                alg: 'none',
                kid: 'key-id',
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            },
            payload: {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
                sub: 'c4r0l',
                exp: 1440982924,
                jti: '911e74f7-793d-482f-ae3c-a52d3857294f',
            },
            signature: 'some-signature',
        }],
        [{
            headers: {
                typ: 'JWT',
                alg: 'none',
            },
            payload: {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        }],
        [{
            headers: {
                typ: 'JWT',
                alg: 'none',
            },
            payload: {
                iss: 'croct.io',
                aud: ['croct.io'],
                iat: 1440982923,
            },
        }],
        [{
            headers: {
                typ: 'JWT',
                alg: 'none',
            },
            payload: {
                iss: 'croct.io',
                aud: ['croct.io'],
                iat: 1440982923,
                metadata: {
                    foo: 'bar',
                },
            },
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            tokenSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    test.each([
        [
            {
                headers: {
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Missing property \'/headers/typ\'.',
        ],
        [
            {
                headers: {
                    typ: 0,
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Expected value of type string at path \'/headers/typ\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 0,
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Expected value of type string at path \'/headers/alg\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Missing property \'/headers/alg\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: 0,
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Expected value of type string at path \'/headers/appId\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: 'foo',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Invalid uuid format at path \'/headers/appId\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Missing property \'/payload/iss\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 0,
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Expected value of type string at path \'/payload/iss\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 0,
                    iat: 1440982923,
                },
            },
            'Expected value of type string or array at path \'/payload/aud\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Missing property \'/payload/aud\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: -1,
                },
            },
            'Expected a value greater than or equal to 0 at path \'/payload/iat\', actual -1.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 'foo',
                },
            },
            'Expected value of type number at path \'/payload/iat\', actual string.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                },
            },
            'Missing property \'/payload/iat\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    sub: '',
                },
            },
            'Expected at least 1 character at path \'/payload/sub\', actual 0.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    sub: 0,
                },
            },
            'Expected value of type string at path \'/payload/sub\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    exp: -1,
                },
            },
            'Expected a value greater than or equal to 0 at path \'/payload/exp\', actual -1.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    exp: 'foo',
                },
            },
            'Expected value of type number at path \'/payload/exp\', actual string.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    jti: 'foo',
                },
            },
            'Invalid uuid format at path \'/payload/jti\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    jti: 0,
                },
            },
            'Expected value of type string at path \'/payload/jti\', actual integer.',
        ],
        [
            {
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Missing property \'/headers\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
            },
            'Missing property \'/payload\'.',
        ],

        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                payload: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
                signature: 0,
            },
            'Expected value of type string at path \'/signature\', actual integer.',
        ],
    ])('should not allow %o', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            tokenSchema.validate(value);
        }

        expect(validate).toThrow(new Error(message));
    });
});
