import {encodeURI as base64Encode} from 'js-base64';
import {webcrypto} from 'crypto';
import {Token, FixedTokenProvider} from '../../src/token';
import {ApiKey} from '../../src/apiKey';

describe('A token', () => {
    const appId = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';
    const anonymousSerializedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNG'
        + 'IzLTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0Ij'
        + 'oxNDQwOTgyOTIzfQ.';

    const binarySignedSerializedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSIsImFwcElkIjoiN2U5ZDU5YTktZTRiM'
        + 'y00NWQ0LWIxYzctNDgyODdmMWU1ZThhIiwia2lkIjoiN2FjMWI4ZDcwMTBiYjZjZDNhM2U4NGU3ZjkwMTM2Yjg4MGJiYzg5OWU0'
        + 'MjhlY2U0OTMzMzM3MjkxMWFiOTA1MiJ9.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0IjoxNDQwOTgyOTIz'
        + 'LCJzdWIiOiJjNHIwbCJ9.GjTvv73vv73vv73vv70F77-977-977-9Hxfvv71gA--_ve-_vRbvv70xa--_vX3vv73vv73vv70Q77-977'
        + '-9Syvvv70QLu-_vSRJRO-_ve-_vUhwW8eQVlhhF3Dvv70H77-977-977-9AO-_vXYCZe-_vRcyCg';

    const binarySignature = 'GjTv'
        + 'v73vv73vv73vv70F77-977-977-9Hxfvv71gA--_ve-_vRbvv70xa--_vX3vv73vv73vv70Q77-977-9Syvvv70QLu-_vSRJRO-'
        + '_ve-_vUhwW8eQVlhhF3Dvv70H77-977-977-9AO-_vXYCZe-_vRcyCg';

    const apiKey = ApiKey.of(
        '00000000-0000-0000-0000-000000000000',
        'ES256;MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQggjT0kWmkzZgekGu76nM5m+uf9WgVp2BeI4'
        + 'vdR1rNcrChRANCAAQnyWGJSbpr3Tq+tK16eOc9mgtS7K/DpMqlDJLXzvxk6Gg73x1eFVUYvXjiG2CZaItxnBTsWa7tmJNpTQ6xsQjM',
    );

    beforeEach(() => {
        Object.defineProperty(global, 'crypto', {value: webcrypto});
    });

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

        expect(token.getSignature()).toBe(binarySignature);
    });

    it('should have a type', () => {
        const type = 'JWT';

        const token = Token.of(
            {
                typ: type,
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(token.getType()).toBe(type);
    });

    it('should have an algorithm', () => {
        const token = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(token.getAlgorithm()).toBe('none');
    });

    it('may have an application ID', () => {
        const tokenWithoutAppId = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(tokenWithoutAppId.getApplicationId()).toBeNull();

        const tokenWithAppId = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
                appId: appId,
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(tokenWithAppId.getApplicationId()).toBe(appId);
    });

    it('may have a key ID', () => {
        const keyId = '7ac1b8d7010bb6cd3a3e84e7f90136b880bbc899e428ece49333372911ab9052';

        const tokenWithKeyId = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
                appId: appId,
                kid: keyId,
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(tokenWithKeyId.getKeyId()).toBe(keyId);
    });

    it('should have an issue time', () => {
        const token = Token.issue(appId, 'c4r0l', 1440982923);

        expect(token.getIssueTime()).toBe(1440982923);
    });

    it('may have an expiration time', () => {
        const tokenWithoutExpiration = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(tokenWithoutExpiration.getExpirationTime()).toBeNull();

        const tokenWithExpiration = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
                exp: 1440982924,
            },
        );

        expect(tokenWithExpiration.getExpirationTime()).toBe(1440982924);
    });

    it('may have a token ID', () => {
        const tokenWithoutTokenId = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(tokenWithoutTokenId.getTokenId()).toBeNull();

        const tokenId = '00000000-0000-0000-0000-000000000001';

        const tokenWithTokenId = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
                appId: appId,
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
                jti: tokenId,
            },
        );

        expect(tokenWithTokenId.getTokenId()).toBe(tokenId);
    });

    it('should have an audience', () => {
        const tokenWithSingleAudience = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(tokenWithSingleAudience.getAudience()).toBe('croct.io');

        const tokenWithMultipleAudiences = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: ['croct.io', 'admin'],
                iat: 1440982923,
            },
        );

        expect(tokenWithMultipleAudiences.getAudience()).toEqual(['croct.io', 'admin']);
    });

    it('should have an issuer', () => {
        const token = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(token.getIssuer()).toBe('croct.io');
    });

    it('may have a subject', () => {
        const tokenWithoutSubject = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
            },
        );

        expect(tokenWithoutSubject.getSubject()).toBeNull();

        const tokenWithSubject = Token.of(
            {
                typ: 'JWT',
                alg: 'none',
            },
            {
                iss: 'croct.io',
                aud: 'croct.io',
                iat: 1440982923,
                sub: 'c4r0l',
            },
        );

        expect(tokenWithSubject.getSubject()).toBe('c4r0l');
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
        const signature = base64Encode('some-signature');
        const encodedToken = anonymousSerializedToken + signature;
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

        expect(token.getSignature()).toEqual(binarySignature);

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

    it('should allow specifying and retrieving the token identifier', () => {
        const token = Token.issue('00000000-0000-0000-0000-000000000000', 'subject', 1234567890);

        expect(token.getTokenId()).toBeNull();

        const tokenWithId = '00000000-0000-0000-0000-000000000001';

        const newToken = token.withTokenId(tokenWithId);

        expect(newToken).not.toBe(token);

        expect(newToken.getTokenId()).toBe(tokenWithId);
    });

    it('should not allow to set an invalid token identifier', () => {
        const token = Token.issue('00000000-0000-0000-0000-000000000000');

        expect(() => token.withTokenId('invalid')).toThrow('The token ID must be a valid UUID.');
    });

    it('should determine whether the token is valid now', () => {
        const iat = 1714617288;
        const exp = 1714620888;

        jest.useFakeTimers();

        const tokenWithExpiration = Token.parse(
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaXNzIjoiQ3JvY3QiLCJh'
            + 'dWQiOiJjcm9jdC5jb20iLCJpYXQiOjE3MTQ2MTcyODgsImV4cCI6MTcxNDYyMDg4OH0',
        )!;

        const tokenWithoutExpiration = Token.parse(
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaXNzIjoiQ3JvY3QiLCJhd'
            + 'WQiOiJjcm9jdC5jb20iLCJpYXQiOjE3MTQ2MTcyODh9',
        )!;

        expect(tokenWithExpiration).not.toBeNull();
        expect(tokenWithoutExpiration).not.toBeNull();

        jest.setSystemTime(iat * 1000);

        expect(tokenWithExpiration.isValidNow()).toBeTrue();
        expect(tokenWithExpiration.isValidNow(iat)).toBeTrue();
        expect(tokenWithExpiration.isValidNow(iat - 1)).toBeFalse();
        expect(tokenWithExpiration.isValidNow(exp)).toBeTrue();
        expect(tokenWithExpiration.isValidNow(exp + 1)).toBeFalse();

        expect(tokenWithoutExpiration.isValidNow()).toBeTrue();
        expect(tokenWithoutExpiration.isValidNow(iat)).toBeTrue();
        expect(tokenWithoutExpiration.isValidNow(iat - 1)).toBeFalse();
        expect(tokenWithoutExpiration.isValidNow(Number.MAX_SAFE_INTEGER)).toBeTrue();
    });

    it('should determine whether the token is signed', async () => {
        const token = Token.issue('00000000-0000-0000-0000-000000000000', 'subject', 1234567890);

        expect(token.isSigned()).toBeFalse();
        expect((await token.signedWith(apiKey)).isSigned()).toBeTrue();
    });

    it('should determine if the key ID matches', async () => {
        const token = Token.issue('00000000-0000-0000-0000-000000000000', 'subject', 1234567890);
        const otherKey = ApiKey.of(
            '00000000-0000-0000-0000-000000000001',
            'ES256;MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgU70V9HrpL/EcoF5pWLAHFEbVbvolUpNxFSAC'
            + 'oza6PNWhRANCAAQkJUbmWcbR6eHeRMEdNgPIJnQ9jgB6zMbwrQo9JrW5POVL2S7Ed4+oW/Q8Ypj9CUw0/g3aUOHKH0JD1QHQaFbx',
        );

        const signedToken = await token.signedWith(apiKey);

        await expect(token.matchesKeyId(otherKey)).resolves.toBeFalse();
        await expect(signedToken.matchesKeyId(apiKey)).resolves.toBeTrue();
        await expect(signedToken.matchesKeyId(otherKey)).resolves.toBeFalse();
    });

    it('should determine whether the token is anonymous', () => {
        const token = Token.issue('00000000-0000-0000-0000-000000000000');

        expect(token.isAnonymous()).toBeTrue();
    });

    it('should determine whether the token is from a specific subject', () => {
        const token = Token.issue('00000000-0000-0000-0000-000000000000', 'subject');

        expect(token.isSubject('subject')).toBeTrue();
        expect(token.isSubject('other')).toBeFalse();
    });

    it('should determine whether the token is newer than another token', () => {
        const now = Math.floor(Date.now() / 1000);
        const oldToken = Token.issue('00000000-0000-0000-0000-000000000000', 'subject', now);
        const newToken = Token.issue('00000000-0000-0000-0000-000000000000', 'subject', now + 1);

        expect(oldToken.isNewerThan(oldToken)).toBeFalse();
        expect(newToken.isNewerThan(oldToken)).toBeTrue();
        expect(oldToken.isNewerThan(newToken)).toBeFalse();
    });

    it('should sign a token', async () => {
        const token = Token.issue('00000000-0000-0000-0000-000000000000', 'subject', 1234567890);
        const signedToken = await token.signedWith(apiKey);

        expect(signedToken.isSigned()).toBeTrue();
        expect(signedToken.getSignature()).toMatch(/^[A-Za-z0-9_-]+$/);

        await expect(signedToken.matchesKeyId(apiKey)).resolves.toBeTrue();
    });

    it('should be convertible to JSON', () => {
        const anonymousToken = Token.parse(anonymousSerializedToken);

        expect(anonymousToken.toJSON()).toBe(anonymousSerializedToken);
    });

    it('should be convertible to string', () => {
        const anonymousToken = Token.parse(anonymousSerializedToken);
        const binarySignedToken = Token.parse(binarySignedSerializedToken);

        expect(anonymousToken.toString()).toBe(anonymousSerializedToken);
        expect(binarySignedToken.toString()).toBe(binarySignedSerializedToken);
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
