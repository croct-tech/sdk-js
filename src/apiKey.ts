export type ParsedPrivateKey = {
    algorithm: string,
    encodedKey: string,
};

type Algorithm = {
    keyAlgorithm: EcKeyImportParams,
    signatureAlgorithm: EcdsaParams,
};

export class ApiKey {
    private static readonly IDENTIFIER_PATTERN = /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i;

    private static readonly PRIVATE_KEY_PATTERN = /^[a-z0-9]+;[^;]+$/i;

    private static readonly ALGORITHMS: Record<string, Algorithm> = {
        ES256: {
            keyAlgorithm: {
                name: 'ECDSA',
                namedCurve: 'P-256',
            },
            signatureAlgorithm: {
                name: 'ECDSA',
                hash: 'SHA-256',
            },
        },
    };

    private readonly identifier: string;

    private readonly privateKey?: ParsedPrivateKey;

    private importedKey: Promise<CryptoKey>;

    private constructor(identifier: string, privateKey?: ParsedPrivateKey) {
        this.identifier = identifier;
        this.privateKey = privateKey;
    }

    public static from(apiKey: string | ApiKey): ApiKey {
        if (apiKey instanceof ApiKey) {
            return apiKey;
        }

        return ApiKey.parse(apiKey);
    }

    public static parse(apiKey: string): ApiKey {
        const parts = apiKey.split(':');

        if (parts.length > 2) {
            throw new Error('Invalid API key format.');
        }

        return ApiKey.of(parts[0], parts[1]);
    }

    public static of(identifier: string, privateKey?: string): ApiKey {
        if (!ApiKey.IDENTIFIER_PATTERN.test(identifier)) {
            throw new Error('The identifier must be a UUID.');
        }

        if (privateKey === undefined || privateKey === '') {
            return new ApiKey(identifier);
        }

        if (!ApiKey.PRIVATE_KEY_PATTERN.test(privateKey)) {
            throw new Error('The private key is malformed.');
        }

        const [algorithmName, encodedKey] = privateKey.split(';');

        if (!(algorithmName in ApiKey.ALGORITHMS)) {
            throw new Error(`Unsupported signing algorithm "${algorithmName}".`);
        }

        return new ApiKey(identifier, {
            algorithm: algorithmName,
            encodedKey: encodedKey,
        });
    }

    public getIdentifier(): string {
        return this.identifier;
    }

    public async getIdentifierHash(): Promise<string> {
        const identifierBytes = ApiKey.createByteArrayFromHexString(this.identifier.replace(/-/g, ''));
        const rawHash = await crypto.subtle.digest('SHA-256', identifierBytes);

        return ApiKey.convertBufferToHexString(rawHash);
    }

    public hasPrivateKey(): boolean {
        return this.privateKey !== undefined;
    }

    public getPrivateKey(): string {
        if (this.privateKey === undefined) {
            throw new Error('The API key does not have a private key.');
        }

        return `${this.privateKey.algorithm};${this.privateKey.encodedKey}`;
    }

    public async sign(data: string): Promise<string> {
        const key = await this.importKey();
        const algorithm = this.getSigningAlgorithm();

        return btoa(
            ApiKey.convertBufferToString(
                await crypto.subtle.sign(
                    ApiKey.ALGORITHMS[algorithm].signatureAlgorithm,
                    key,
                    ApiKey.createByteArrayFromString(data),
                ),
            ),
        );
    }

    public getSigningAlgorithm(): string {
        const {algorithm} = this.getParsedPrivateKey();

        return algorithm;
    }

    private importKey(): Promise<CryptoKey> {
        const {algorithm, encodedKey} = this.getParsedPrivateKey();

        if (this.importedKey === undefined) {
            this.importedKey = crypto.subtle
                .importKey(
                    'pkcs8',
                    ApiKey.createByteArrayFromString(atob(encodedKey)),
                    ApiKey.ALGORITHMS[algorithm].keyAlgorithm,
                    false,
                    ['sign'],
                );
        }

        return this.importedKey;
    }

    private getParsedPrivateKey(): ParsedPrivateKey {
        if (this.privateKey === undefined) {
            throw new Error('The API key does not have a private key.');
        }

        return this.privateKey;
    }

    public export(): string {
        return this.identifier + (this.hasPrivateKey() ? `:${this.getPrivateKey()}` : '');
    }

    public toString(): string {
        return '[redacted]';
    }

    /**
     * Create an array buffer from a string.
     *
     * @see https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
     *
     * @param data The string to convert.
     * @returns The array buffer.
     */
    private static createByteArrayFromString(data: string): Uint8Array {
        const byteArray = new Uint8Array(data.length);

        for (let i = 0; i < byteArray.length; i++) {
            byteArray[i] = data.charCodeAt(i);
        }

        return byteArray;
    }

    private static createByteArrayFromHexString(data: string): Uint8Array {
        const byteArray = new Uint8Array(data.length / 2);

        for (let i = 0; i < byteArray.length; i++) {
            byteArray[i] = parseInt(data.substring(i * 2, i * 2 + 2), 16);
        }

        return byteArray;
    }

    /**
     * Convert an array buffer to a string.
     *
     * @see https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
     *
     * @param buffer The buffer to convert.
     * @returns The string.
     */
    private static convertBufferToString(buffer: ArrayLike<number> | ArrayBufferLike): string {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    private static convertBufferToHexString(buffer: ArrayLike<number> | ArrayBufferLike): string {
        const bytes = new Uint8Array(buffer);
        let hexString = '';

        for (let i = 0; i < bytes.length; i++) {
            hexString += bytes[i].toString(16).padStart(2, '0');
        }

        return hexString;
    }
}
