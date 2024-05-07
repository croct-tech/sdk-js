import {webcrypto} from 'crypto';
import {ApiKey} from '../src/apiKey';

describe('An API key', () => {
    const privateKey = 'ES256;MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg3TbbvRM7DNwxY3XGWDmlSRPSfZ9b+ch9TO3jQ6'
        + '8Zyj+hRANCAASmJj/EiEhUaLAWnbXMTb/85WADkuFgoELGZ5ByV7YPlbb2wY6oLjzGkpF6z8iDrvJ4kV6EhaJ4n0HwSQckVLNE';
    const identifier = '00000000-0000-0000-0000-000000000000';

    const apiKey = ApiKey.of(identifier, privateKey);

    beforeEach(() => {
        Object.defineProperty(global, 'crypto', {value: webcrypto});
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should parse an exported API key', () => {
        expect(ApiKey.parse(apiKey.export()).export()).toBe(apiKey.export());
    });

    it('should fail to parse an API key with a malformed identifier', () => {
        expect(() => ApiKey.parse('invalid')).toThrow('The identifier must be a UUID.');
    });

    it('should fail to parse an API key with a malformed private key', () => {
        expect(() => ApiKey.parse(`${identifier}:foo`)).toThrow('The private key is malformed.');
    });

    it('should fail to parse an API key with invalid format', () => {
        expect(() => ApiKey.parse(`${identifier}:0:`)).toThrow('Invalid API key format.');
    });

    it('should fail to parse secret key with unsupported algorithm', () => {
        expect(() => ApiKey.parse(`${identifier}:invalid;secret`)).toThrow('Unsupported signing algorithm "invalid".');
    });

    it('should parse an API key with an empty private key', () => {
        expect(ApiKey.parse(`${identifier}:`).hasPrivateKey()).toBeFalse();
    });

    it('should fail to create an API key with a malformed identifier', () => {
        expect(() => ApiKey.of('invalid')).toThrow('The identifier must be a UUID.');
    });

    it('should fail to create an API key with a malformed private key', () => {
        expect(() => ApiKey.of(identifier, 'invalid')).toThrow('The private key is malformed.');
    });

    it('should fail to create an API key with an invalid private key', () => {
        expect(() => ApiKey.of(identifier, '302e020100')).toThrow('The private key is malformed.');
    });

    it('should fail to create an API key with an unsupported signing algorithm', () => {
        expect(() => ApiKey.of(identifier, 'invalid;secret')).toThrow('Unsupported signing algorithm "invalid".');
    });

    it('should create an API key with an empty private key', () => {
        expect(ApiKey.of(identifier, '').hasPrivateKey()).toBeFalse();
    });

    it('should create an API key from an API key', () => {
        expect(ApiKey.from(apiKey)).toBe(apiKey);
    });

    it('should create an API key from an exported API key', () => {
        expect(ApiKey.from(apiKey.export()).toString()).toEqual(apiKey.toString());
    });

    it('should return the identifier', () => {
        expect(apiKey.getIdentifier()).toBe(identifier);
    });

    it('should return the identifier hash', async () => {
        await expect(apiKey.getIdentifierHash()).resolves.toBe(
            '374708fff7719dd5979ec875d56cd2286f6d3cf7ec317a3b25632aab28ec37bb',
        );
    });

    it('should determine whether the API key has a private key', () => {
        expect(apiKey.hasPrivateKey()).toBeTrue();
    });

    it('should return the private key', () => {
        expect(apiKey.getPrivateKey()).toBe(privateKey);
    });

    it('should fail to return the private key if not available', () => {
        const apiKeyWithoutPrivateKey = ApiKey.of(identifier);

        expect(() => apiKeyWithoutPrivateKey.getPrivateKey()).toThrow('The API key does not have a private key.');
    });

    it('should sign a string', async () => {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: 'ECDSA',
                namedCurve: 'P-256',
            },
            true,
            ['sign', 'verify'],
        );

        const exportedKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
        const localPrivateKey = Buffer.from(exportedKey).toString('base64');

        const localKey = ApiKey.of(identifier, `ES256;${localPrivateKey}`);
        const payload = 'data';
        const signature = await localKey.sign(payload);

        const verification = crypto.subtle.verify(
            {
                name: 'ECDSA',
                hash: {
                    name: 'SHA-256',
                },
            },
            keyPair.publicKey,
            createArrayBuffer(signature),
            createArrayBuffer(payload),
        );

        await expect(verification).resolves.toBeTrue();
    });

    it('should fail to sign a string when the API key does not have a private key', async () => {
        const apiKeyWithoutPrivateKey = ApiKey.of(identifier);

        await expect(apiKeyWithoutPrivateKey.sign('data')).rejects.toThrow(
            'The API key does not have a private key.',
        );
    });

    it('should report errors when failing to sign a string', async () => {
        const error = new Error('error');

        jest.spyOn(crypto.subtle, 'sign').mockRejectedValue(error);

        await expect(apiKey.sign('data')).rejects.toThrow(error);
    });

    it('should export the API key', () => {
        expect(ApiKey.of(apiKey.getIdentifier()).export()).toBe(apiKey.getIdentifier());
        expect(apiKey.export()).toBe(`${apiKey.getIdentifier()}:${apiKey.getPrivateKey()}`);
    });

    it('should redact the private key', () => {
        expect(apiKey.toString()).toBe('[redacted]');
    });

    function createArrayBuffer(data: string): ArrayBuffer {
        const buffer = new ArrayBuffer(data.length);
        const view = new Uint8Array(buffer);

        for (let i = 0; i < data.length; i++) {
            view[i] = data.charCodeAt(i);
        }

        return view;
    }
});
