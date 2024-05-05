import * as crypto from 'crypto';
import {ApiKey} from '../src/apiKey';

describe('An API key', () => {
    const apiKey = ApiKey.of(
        '00000000-0000-0000-0000-000000000000',
        '302e020100300506032b6570042204206d0e45033d54aa3231fcef9f0eaa1ff559a68884dbcc8931181b312f90513261',
    );

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('should parse an exported API key', () => {
        expect(ApiKey.parse(apiKey.export()).export()).toBe(apiKey.export());
    });

    it('should fail to parse an API key with a malformed identifier', () => {
        expect(() => ApiKey.parse('invalid')).toThrow('The API key identifier must be a UUID.');
    });

    it('should fail to parse an API key with an malformed private key', () => {
        expect(() => ApiKey.parse('00000000-0000-0000-0000-000000000000:foo'))
            .toThrow('The API key private key must be a hexadecimal string.');
    });

    it('should fail to parse an API key with invalid format', () => {
        expect(() => ApiKey.parse('00000000-0000-0000-0000-000000000000:0:')).toThrow('Invalid API key format.');
    });

    it('should fail to create an API key with a malformed identifier', () => {
        expect(() => ApiKey.of('invalid')).toThrow('The API key identifier must be a UUID.');
    });

    it('should fail to create an API key with a malformed private key', () => {
        expect(() => ApiKey.of('00000000-0000-0000-0000-000000000000', 'invalid'))
            .toThrow('The API key private key must be a hexadecimal string.');
    });

    it('should fail to create an API key with an invalid private key', () => {
        expect(() => ApiKey.of('00000000-0000-0000-0000-000000000000', '302e020100'))
            .toThrow('Invalid private key.');
    });

    it('should create an API key from an API key', () => {
        expect(ApiKey.from(apiKey)).toBe(apiKey);
    });

    it('should create an API key from an exported API key', () => {
        expect(ApiKey.from(apiKey.export()).toString()).toEqual(apiKey.toString());
    });

    it('should return the identifier', () => {
        expect(apiKey.getIdentifier()).toBe('00000000-0000-0000-0000-000000000000');
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
        expect(apiKey.getPrivateKey()).toBe(
            '302e020100300506032b6570042204206d0e45033d54aa3231fcef9f0eaa1ff559a68884dbcc8931181b312f90513261',
        );
    });

    it('should sign a blob', async () => {
        const blob = Buffer.from('blob');

        await expect(apiKey.sign(blob).then(result => result.toString('hex'))).resolves.toBe(
            '6b8d6529b7f694169ad2e346a31927c617f86e345852eb4e46d57ffd338f952'
            + 'b680da805bddd6e53b865f31b39158de42c3f347b0a61214050946d958fa44106',
        );
    });

    it('should fail to sign a blob with the API key does not have a private key', async () => {
        const apiKeyWithoutPrivateKey = ApiKey.of('00000000-0000-0000-0000-000000000000');
        const blob = Buffer.from('blob');

        await expect(apiKeyWithoutPrivateKey.sign(blob)).rejects.toThrow(
            'The API key does not have a private key.',
        );
    });

    it('should report errors when failing to sign a blob', async () => {
        const blob = Buffer.from('blob');
        const error = new Error('error');

        jest.spyOn(crypto, 'sign').mockImplementation((
            _: unknown,
            __: unknown,
            ___: unknown,
            callback: (error: Error | null, data: Buffer) => void,
        ): void => {
            callback(error, Buffer.from(''));
        });

        await expect(apiKey.sign(blob)).rejects.toThrow(error);
    });

    it('should export the API key', () => {
        expect(ApiKey.of(apiKey.getIdentifier()).export()).toBe(apiKey.getIdentifier());
        expect(apiKey.export()).toBe(`${apiKey.getIdentifier()}:${apiKey.getPrivateKey()}`);
    });

    it('should redact the private key', () => {
        expect(apiKey.toString()).toBe('[redacted]');
    });
});
