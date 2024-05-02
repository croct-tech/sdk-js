import type {KeyObject} from 'node:crypto';

let nodeCrypto: typeof import('node:crypto') | null = null;

try {
    // eslint-disable-next-line global-require -- Import only if available
    nodeCrypto = require('node:crypto');
} catch {
    // Ignore import error for client-side;
}

export class ApiKey {
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

        const [identifier, privateKey] = apiKey.split(':', 2);

        if (privateKey === undefined) {
            return new ApiKey(identifier);
        }

        if (nodeCrypto === null) {
            throw new Error('The crypto Node module is not available.');
            // return new ApiKey(identifier);
        }

        return new ApiKey(identifier, nodeCrypto.createPrivateKey({
            key: Buffer.from(privateKey, 'hex'),
            format: 'der',
            type: 'pkcs8',
        }));
    }

    public getIdentifier(): string {
        return this.identifier;
    }

    public async getHash(): Promise<string> {
        const identifierBytes = Buffer.from(this.identifier, 'utf-8');
        const rawHash = await crypto.subtle.digest('SHA-256', identifierBytes);

        return Buffer.from(rawHash).toString('hex');
    }

    public signBlob(blob: Buffer): Promise<Buffer> {
        if (this.privateKey === undefined || nodeCrypto === null) {
            throw new Error('No private key available for signing');
        }

        return new Promise((resolve, reject) => {
            // TS forgets the type narrowing inside the Promise constructor function.
            nodeCrypto!.sign(null, blob, this.privateKey!, (error, signature) => {
                if (error == null) {
                    resolve(signature);
                } else {
                    reject(error);
                }
            });
        });
    }
}
