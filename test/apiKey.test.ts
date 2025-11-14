import {createPublicKey, verify, webcrypto} from 'crypto';
import {ApiKey} from '../src/apiKey';
import {p256} from '@noble/curves/p256';

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

    it('should sign a string 2222222', async () => {
        const payload = Buffer.from('VERCEL:ICsyyDlekxXqSNSms4E718Vg');

        const privateB64 = 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgpi28+uG/pKYLWa3mRk/vCZotGowN/4iGhwnSJiv3YUShR'
            + 'ANCAATPBiX0zfNDzXJHkXp6+Q8Z+jnJRmo5u176Ay9BpAC8+tbpACBOeDRFWbq4L8JBJuQqd8DavweplifBzRRy76MG';

        const publicJwt = JSON.parse('{"kty":"EC","x":"zwYl9M3zQ81yR5F6evkPGfo5yUZqObte-gMvQaQAvPo","y":"1ukAIE54NEVZurgvwkEm5Cp3wNq_B6mWJ8HNFHLvowY","crv":"P-256","kid":"55a10954-4b47-4986-8cff-19a30513ab38"}')

        // const privateCryptoKey = createPrivateKey({
        //     type: 'pkcs8',
        //     format: 'der',
        //     key: Buffer.from(privateB64, 'base64'),
        // });

        const publicCryptoKey = createPublicKey({
            key: publicJwt,
            format: 'jwk',
        });

        const privateWebKey = await crypto.subtle
            .importKey(
                'pkcs8',
                createByteArrayFromString(atob(privateB64)),
                {
                    name: 'ECDSA',
                    namedCurve: 'P-256',
                },
                false,
                ['sign'],
            );

        const publicWebKey = await crypto.subtle
            .importKey(
                'jwk',
                publicJwt,
                {
                    name: 'ECDSA',
                    namedCurve: 'P-256',
                },
                false,
                ['verify'],
            );

        const webSignature = await crypto.subtle.sign(
            {
                name: 'ECDSA',
                hash: 'SHA-256',
            },
            privateWebKey,
            payload,
        );

        console.log(Buffer.from(convertBufferToString(webSignature), 'binary').toString('base64'));

        // const cryptoSignature = sign('sha256', payload, privateCryptoKey);

        const webVerification = await crypto.subtle.verify(
            {
                name: 'ECDSA',
                hash: 'SHA-256',
            },
            publicWebKey,
            createByteArrayFromHexString(convertBufferToHexString(webSignature)),
            payload,
        );

        const cryptoVerification = verify(
            'sha256',
            payload,
            {
                key: publicCryptoKey,
                dsaEncoding: 'ieee-p1363'
            },
            //convertRawSignatureToDER(Buffer.from(Buffer.from(webSignature).toString('hex'), 'hex')),
            Buffer.from(convertBufferToString(webSignature), 'binary'),
        );

        console.log(webVerification, cryptoVerification);
    });

    function createArrayBuffer(data: string): ArrayBuffer {
        const buffer = new ArrayBuffer(data.length);
        const view = new Uint8Array(buffer);

        for (let i = 0; i < data.length; i++) {
            view[i] = data.charCodeAt(i);
        }

        return view;
    }

    function createByteArrayFromString(data: string): Uint8Array {
        const byteArray = new Uint8Array(data.length);

        for (let i = 0; i < byteArray.length; i++) {
            byteArray[i] = data.charCodeAt(i);
        }

        return byteArray;
    }

    function convertBufferToString(buffer: ArrayLike<number> | ArrayBufferLike): string {
        return String.fromCharCode(...new Uint8Array(buffer));
    }

    function convertBufferToHexString(buffer: ArrayLike<number> | ArrayBufferLike): string {
        const bytes = new Uint8Array(buffer);
        let hexString = '';

        for (let i = 0; i < bytes.length; i++) {
            hexString += bytes[i].toString(16).padStart(2, '0');
        }

        return hexString;
    }

    function createByteArrayFromHexString(data: string): Uint8Array {
        const byteArray = new Uint8Array(data.length / 2);

        for (let i = 0; i < byteArray.length; i++) {
            byteArray[i] = parseInt(data.substring(i * 2, i * 2 + 2), 16);
        }

        return byteArray;
    }

    function convertRawSignatureToDER(rawSig: Uint8Array | Buffer): Buffer {
        if (rawSig.length !== 64) throw new Error('Assinatura inválida: esperado 64 bytes');

        const r = rawSig.slice(0, 32);
        const s = rawSig.slice(32, 64);

        const der = p256.Signature.fromCompact(Uint8Array.from([...r, ...s])).toDERHex();
        return Buffer.from(der, 'hex');
    }
});
