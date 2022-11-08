import {Token, FixedTokenProvider} from '../../src/token';
import {base64UrlEncode} from '../../src/base64Url';

describe('A token', () => {
    const appId = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';
    const anonymousSerializedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNG'
        + 'IzLTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0Ij'
        + 'oxNDQwOTgyOTIzfQ.';

    test('may contain headers', () => {
        const token = Token.issue(appId, 'c4r0l', 1440982923);

        expect(token.getHeaders()).toEqual({
            typ: 'JWT',
            alg: 'none',
            appId: appId,
        });
    });

    test('may contain claims', () => {
        const token = Token.issue(appId, 'c4r0l', 1440982923);

        expect(token.getPayload()).toEqual({
            iss: 'croct.io',
            aud: 'croct.io',
            iat: 1440982923,
            sub: 'c4r0l',
        });
    });

    test('may contain a signature', () => {
        const token = Token.parse(`${anonymousSerializedToken}${base64UrlEncode('some-signature')}`);

        expect(token.getSignature()).toBe('some-signature');
    });

    test('should have an issue time', () => {
        const token = Token.issue(appId, 'c4r0l', 1440982923);

        expect(token.getIssueTime()).toBe(1440982923);
    });

    test('may have a subject', () => {
        const identifiedToken = Token.issue(appId, 'c4r0l', 1440982923);
        const anonymousToken = Token.issue(appId, null, 1440982923);

        expect(identifiedToken.getSubject()).toBe('c4r0l');
        expect(anonymousToken.getSubject()).toBeNull();
    });

    test('should not have an empty subject', () => {
        function invalidToken(): void {
            Token.issue(appId, '', 1440982923);
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The subject must be non-empty.');
    });

    test('should determine whether the subject is anonymous', () => {
        const identifiedToken = Token.issue(appId, 'c4r0l', 1440982923);
        const anonymousToken = Token.issue(appId, null, 1440982923);

        expect(identifiedToken.isAnonymous()).toBeFalsy();
        expect(anonymousToken.isAnonymous()).toBeTruthy();
    });

    test('should not have a negative timestamp', () => {
        function invalidToken(): void {
            Token.issue(appId, 'c4r0l', -1);
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The timestamp must be non-negative.');
    });

    test('should be parsed and serialized', () => {
        const signature = 'some-signature';
        const encodedToken = anonymousSerializedToken + base64UrlEncode(signature);
        const anonymousToken = Token.parse(encodedToken);

        expect(anonymousToken.getHeaders()).toEqual({
            typ: 'JWT',
            alg: 'none',
            appId: appId,
        });
        expect(anonymousToken.getPayload()).toEqual({
            iss: 'croct.io',
            aud: 'croct.io',
            iat: 1440982923,
        });
        expect(anonymousToken.getSignature()).toBe(signature);
        expect(anonymousToken.toString()).toBe(encodedToken);
    });

    test('should parse a token with a list of audiences', () => {
        const token = Token.parse(
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNGIzLTQ1ZDQtYjFjNy00OD'
            + 'I4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6WyJjcm9jdC5pbyJdLCJpYXQiOjE0NDA5'
            + 'ODI5MjMsInN1YiI6ImM0cjBsIn0.',
        );

        expect(token.getHeaders()).toEqual({
            typ: 'JWT',
            alg: 'none',
            appId: appId,
        });

        expect(token.getPayload()).toEqual({
            sub: 'c4r0l',
            iss: 'croct.io',
            aud: ['croct.io'],
            iat: 1440982923,
        });
    });

    test('should fail to parse an empty token', () => {
        function invalidToken(): void {
            Token.parse('');
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The token cannot be empty.');
    });

    test('should fail to parse a malformed token', () => {
        function invalidToken(): void {
            Token.parse('a');
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The token is malformed.');
    });

    test('should fail to parse a corrupted token', () => {
        function invalidToken(): void {
            Token.parse('a.b');
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The token is corrupted.');
    });

    test('should fail to parse an invalid token', () => {
        function invalidToken(): void {
            Token.parse('eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiJmb28ifQ.'
                + 'eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0IjowfQ.');
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The token is invalid: invalid uuid format at path \'/headers/appId\'.');
    });

    test('should be convertible to JSON', () => {
        const anonymousToken = Token.parse(anonymousSerializedToken);

        expect(anonymousToken.toJSON()).toBe(anonymousSerializedToken);
    });

    test('should be convertible to string', () => {
        const anonymousToken = Token.parse(anonymousSerializedToken);

        expect(anonymousToken.toString()).toBe(anonymousSerializedToken);
    });
});

describe('A fixed token provider', () => {
    test('should always provide the same token', () => {
        const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);
        const provider = new FixedTokenProvider(token);

        expect(provider.getToken()).toEqual(token);
        expect(provider.getToken()).toEqual(token);
        expect(provider.getToken()).toEqual(token);
    });
});
