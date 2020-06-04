import {Logger} from './logging/index';
import {formatCause} from './error';
import NullLogger from './logging/nullLogger';

export interface CidAssigner {
    assignCid(): Promise<string>;
}

export class CachedAssigner implements CidAssigner {
    private readonly generator: CidAssigner;

    private readonly storage: Storage;

    private readonly key: string;

    private readonly logger: Logger;

    public constructor(generator: CidAssigner, storage: Storage, key: string, logger?: Logger) {
        this.generator = generator;
        this.key = key;
        this.storage = storage;
        this.logger = logger ?? new NullLogger();
    }

    public async assignCid(): Promise<string> {
        const cid = this.storage.getItem(this.key);

        if (cid !== null) {
            this.logger.debug('Previous CID loaded from cache');

            return cid;
        }

        const newCid = await this.generator.assignCid();

        this.logger.debug('New CID stored into cache');

        this.storage.setItem(this.key, newCid);

        return newCid;
    }
}

export class RemoteAssigner implements CidAssigner {
    private readonly logger: Logger;

    private readonly endpoint: string;

    public constructor(endpoint: string, logger?: Logger) {
        this.endpoint = endpoint;
        this.logger = logger ?? new NullLogger();
    }

    public async assignCid(): Promise<string> {
        const options: RequestInit = {
            method: 'GET',
            credentials: 'include',
        };

        const response = await window.fetch(this.endpoint, options);

        if (!response.ok) {
            const error = new Error(`Failed to assign CID: ${formatCause(response.statusText)}`);

            this.logger.error(error.message);

            throw error;
        }

        this.logger.debug('New CID successfully assigned');

        return response.text();
    }
}

export class FixedCidAssigner implements CidAssigner {
    private readonly cid: string;

    public constructor(cid: string) {
        this.cid = cid;
    }

    public assignCid(): Promise<string> {
        return Promise.resolve(this.cid);
    }
}
