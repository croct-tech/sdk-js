import type {Logger} from '../logging';
import {NullLogger} from '../logging';
import {formatCause} from '../error';
import type {CidAssigner} from './assigner';
import {CLIENT_LIBRARY} from '../constants';

export class RemoteAssigner implements CidAssigner {
    private readonly logger: Logger;

    private readonly endpoint: string;

    private pending?: Promise<string>;

    public constructor(endpoint: string, logger?: Logger) {
        this.endpoint = endpoint;
        this.logger = logger ?? new NullLogger();
    }

    public assignCid(currentCid?: string): Promise<string> {
        if (this.pending === undefined) {
            this.pending = this.fetchCid(currentCid).finally(() => {
                this.pending = undefined;
            });
        }

        return this.pending;
    }

    private async fetchCid(currentCid?: string): Promise<string> {
        const options: RequestInit = {
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Client-Library': CLIENT_LIBRARY,
            },
        };

        const endpoint = new URL(this.endpoint);

        if (currentCid !== undefined) {
            endpoint.searchParams.set('cid', currentCid);
        }

        const response = await fetch(endpoint, options);

        if (!response.ok) {
            const error = new Error(`Failed to assign CID: ${formatCause(response.statusText)}`);

            this.logger.error(error.message);

            throw error;
        }

        this.logger.debug('New CID successfully assigned');

        return response.text();
    }
}
