import {Token, FixedTokenProvider} from '../../src/token';
import {base64UrlEncode, base64UrlDecode} from '../../src/base64Url';

describe('A token', () => {
    const appId = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';
    const anonymousSerializedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNG'
        + 'IzLTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0Ij'
        + 'oxNDQwOTgyOTIzfQ.';
    const binarySignature = 'VIBocta06jN0I6YXPiqtfAm_QJn64aLaM_'
        + 'slfBo6MhRApV0znNagbMM5102L5OwtFLDMC8BFHFeKnHxrFKSK0Q';

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

    it('should parse and serialize a token with UTF-8 characters and binary signature', () => {
        const data = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IkV4cGV'
            + 'yacOqbmNpYSBwYXJhIFPDo28gUGF1bG8ifQ.eyJleHAiOjE2NzEyMDQ4MD'
            + 'csImlhdCI6MTY3MTIwMTIwNywibmJmIjoxNjcxMjAxMjA3LCJpc3MiOiJj'
            + 'cm9jdC5jb20iLCJhdWQiOiJjcm9jdC5jb206YWRtaW4iLCJzY29wZSI6Wy'
            + 'JQUkVWSUVXIl0sInN1YiI6ImE0MTliMGRjLWJjZGItNDJmMi1iMzczLTQ5'
            + 'NjM4NzA3MmYxYyIsIm1ldGFkYXRhIjp7InByZXZpZXdNb2RlIjoicHVibG'
            + 'lzaGVkQ29udGVudCIsImV4cGVyaWVuY2VJZCI6ImUzN2M5MGY4LTJiZDgt'
            + 'NDdlNi04NWRlLTAyYTUyNThiNDlkMiIsImV4cGVyaWVuY2VOYW1lIjoiRX'
            + 'hwZXJpw6puY2lhIHBhcmEgU8OjbyBQYXVsbyIsImF1ZGllbmNlSWQiOiI5'
            + 'ZmZjMmE1Ny0zZGYzLTQ2YzgtYmIyYS05NjcwNmVhYzJlYjUiLCJhdWRpZW'
            + `5jZU5hbWUiOiJ0ZXN0In19.${binarySignature}`;

        const token = Token.parse(data);

        expect(token.getHeaders()).toEqual({
            typ: 'JWT',
            alg: 'ES256',
            kid: 'Experiência para São Paulo',
        });

        expect(token.getPayload()).toEqual({
            aud: 'croct.com:admin',
            sub: 'a419b0dc-bcdb-42f2-b373-496387072f1c',
            exp: 1671204807,
            iat: 1671201207,
            nbf: 1671201207,
            scope: ['PREVIEW'],
            iss: 'croct.com',
            metadata: {
                experienceId: 'e37c90f8-2bd8-47e6-85de-02a5258b49d2',
                experienceName: 'Experiência para São Paulo',
                audienceId: '9ffc2a57-3df3-46c8-bb2a-96706eac2eb5',
                audienceName: 'test',
                previewMode: 'publishedContent',
            },
        });

        expect(token.getSignature()).toEqual(base64UrlDecode(binarySignature, false));

        expect(token.toString()).toEqual(data);
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
