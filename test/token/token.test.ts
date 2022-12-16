import {Token, FixedTokenProvider} from '../../src/token';
import {base64UrlEncode, base64UrlDecode} from '../../src/base64Url';

describe('A token', () => {
    const appId = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';
    const anonymousSerializedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNG'
        + 'IzLTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0Ij'
        + 'oxNDQwOTgyOTIzfQ.';

    it('may contain headers', () => {
        const token = Token.issue(appId, 'c4r0l', 1440982923);

        expect(token.getHeaders()).toEqual({
            typ: 'JWT',
            alg: 'none',
            appId: appId,
        });
    });

    it('may contain claims', () => {
        const token = Token.issue(appId, 'c4r0l', 1440982923);

        expect(token.getPayload()).toEqual({
            iss: 'croct.io',
            aud: 'croct.io',
            iat: 1440982923,
            sub: 'c4r0l',
        });
    });

    it('may contain a signature', () => {
        const binarySignature = 'uLvpiRxDrYpU1BO4Y6rLyFv3uj3PuPD3KFg1RA_Wu5S4'
            + 'svht8KsdS1WR8Sr-L55e-7_y9Do8LCTo3ZWp92JZDQ';

        const token = Token.parse(`${anonymousSerializedToken}${binarySignature}`);

        // The result is a binary string
        expect(token.getSignature()).toBe(base64UrlDecode(binarySignature, false));
    });

    it('should have an issue time', () => {
        const token = Token.issue(appId, 'c4r0l', 1440982923);

        expect(token.getIssueTime()).toBe(1440982923);
    });

    it('may have a subject', () => {
        const identifiedToken = Token.issue(appId, 'c4r0l', 1440982923);
        const anonymousToken = Token.issue(appId, null, 1440982923);

        expect(identifiedToken.getSubject()).toBe('c4r0l');
        expect(anonymousToken.getSubject()).toBeNull();
    });

    it('should not have an empty subject', () => {
        function invalidToken(): void {
            Token.issue(appId, '', 1440982923);
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The subject must be non-empty.');
    });

    it('should determine whether the subject is anonymous', () => {
        const identifiedToken = Token.issue(appId, 'c4r0l', 1440982923);
        const anonymousToken = Token.issue(appId, null, 1440982923);

        expect(identifiedToken.isAnonymous()).toBeFalsy();
        expect(anonymousToken.isAnonymous()).toBeTruthy();
    });

    it('should not have a negative timestamp', () => {
        function invalidToken(): void {
            Token.issue(appId, 'c4r0l', -1);
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The timestamp must be non-negative.');
    });

    it('should be parsed and serialized', () => {
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

    it('should parse a token with a list of audiences', () => {
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

    it('should fail to parse an empty token', () => {
        function invalidToken(): void {
            Token.parse('');
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The token cannot be empty.');
    });

    it('should fail to parse a malformed token', () => {
        function invalidToken(): void {
            Token.parse('a');
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The token is malformed.');
    });

    it('should fail to parse a corrupted token', () => {
        function invalidToken(): void {
            Token.parse('a.b');
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The token is corrupted.');
    });

    it('should fail to parse an invalid token', () => {
        function invalidToken(): void {
            Token.parse('eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiJmb28ifQ.'
                + 'eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0IjowfQ.');
        }

        expect(invalidToken).toThrow();
        expect(invalidToken).toThrow('The token is invalid: invalid uuid format at path \'/headers/appId\'.');
    });

    it('should be convertible to JSON', () => {
        const anonymousToken = Token.parse(anonymousSerializedToken);

        expect(anonymousToken.toJSON()).toBe(anonymousSerializedToken);
    });

    it('should be convertible to string', () => {
        const anonymousToken = Token.parse(anonymousSerializedToken);

        expect(anonymousToken.toString()).toBe(anonymousSerializedToken);
    });
});

describe('A fixed token provider', () => {
    it('should always provide the same token', () => {
        const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);
        const provider = new FixedTokenProvider(token);

        expect(provider.getToken()).toEqual(token);
        expect(provider.getToken()).toEqual(token);
        expect(provider.getToken()).toEqual(token);
    });
});
