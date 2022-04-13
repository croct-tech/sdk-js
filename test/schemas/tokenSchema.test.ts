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
            claims: {
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
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            },
            claims: {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        }],
        [{
            headers: {
                typ: 'JWT',
                alg: 'none',
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            },
            claims: {
                iss: 'croct.io',
                aud: ['croct.io'],
                iat: 1440982923,
            },
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            tokenSchema.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [
            {
                headers: {
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
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
                claims: {
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
                claims: {
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
                claims: {
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
                claims: {
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
                claims: {
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
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Missing property \'/headers/appId\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Missing property \'/claims/iss\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 0,
                    aud: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Expected value of type string at path \'/claims/iss\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 0,
                    iat: 1440982923,
                },
            },
            'Expected value of type string or array at path \'/claims/aud\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    iat: 1440982923,
                },
            },
            'Missing property \'/claims/aud\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: -1,
                },
            },
            'Expected a value greater than or equal to 0 at path \'/claims/iat\', actual -1.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 'foo',
                },
            },
            'Expected value of type number at path \'/claims/iat\', actual string.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                },
            },
            'Missing property \'/claims/iat\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    sub: '',
                },
            },
            'Expected at least 1 character at path \'/claims/sub\', actual 0.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    sub: 0,
                },
            },
            'Expected value of type string at path \'/claims/sub\', actual integer.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    exp: -1,
                },
            },
            'Expected a value greater than or equal to 0 at path \'/claims/exp\', actual -1.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    exp: 'foo',
                },
            },
            'Expected value of type number at path \'/claims/exp\', actual string.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    jti: 'foo',
                },
            },
            'Invalid uuid format at path \'/claims/jti\'.',
        ],
        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                    jti: 0,
                },
            },
            'Expected value of type string at path \'/claims/jti\', actual integer',
        ],
        [
            {
                claims: {
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
            'Missing property \'/claims\'.',
        ],

        [
            {
                headers: {
                    typ: 'JWT',
                    alg: 'none',
                    appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                },
                claims: {
                    iss: 'croct.io',
                    aud: 'croct.io',
                    iat: 1440982923,
                },
                signature: 0,
            },
            'Expected value of type string at path \'/signature\', actual integer',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            tokenSchema.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
