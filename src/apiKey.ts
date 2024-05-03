import * as crypto from 'crypto';
import {KeyObject} from 'crypto';

export class ApiKey {
    private static readonly IDENTIFIER_PATTERN = /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i;

    private static readonly PRIVATE_KEY_PATTERN = /^[a-f0-9]+$/i;

    private readonly identifier: string;

    private readonly privateKey?: KeyObject;

    private constructor(identifier: string, privateKey?: KeyObject) {
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
            throw new Error('The API key identifier must be a UUID.');
        }

        if (privateKey === undefined) {
            return new ApiKey(identifier);
        }

        if (!ApiKey.PRIVATE_KEY_PATTERN.test(privateKey)) {
            throw new Error('The API key private key must be a hexadecimal string.');
        }

        try {
            return new ApiKey(identifier, crypto.createPrivateKey({
                key: Buffer.from(privateKey, 'hex'),
                format: 'der',
                type: 'pkcs8',
            }));
        } catch {
            throw new Error('Invalid private key.');
        }
    }

    public getIdentifier(): string {
        return this.identifier;
    }

    public async getIdentifierHash(): Promise<string> {
        const identifierBytes = Buffer.from(this.identifier.replace(/[^a-z0-9]/g, ''), 'hex');
        const rawHash = await crypto.subtle.digest('SHA-256', identifierBytes);

        return Buffer.from(rawHash).toString('hex');
    }

    public hasPrivateKey(): boolean {
        return this.privateKey !== undefined;
    }

    public getPrivateKey(): string|null {
        return this.privateKey === undefined
            ? null
            : this.privateKey
                .export({format: 'der', type: 'pkcs8'})
                .toString('hex');
    }

    public sign(blob: Buffer): Promise<Buffer> {
        const {privateKey} = this;

        if (privateKey === undefined) {
            return Promise.reject(new Error('The API key does not have a private key.'));
        }

        return new Promise((resolve, reject) => {
            crypto.sign(null, blob, privateKey, (error, signature) => {
                if (error == null) {
                    resolve(signature);
                } else {
                    reject(error);
                }
            });
        });
    }

    public export(): string {
        const privateKey = this.getPrivateKey();

        return this.identifier + (privateKey === null ? '' : `:${privateKey}`);
    }

    public toString(): string {
        return '[redacted]';
    }
}
