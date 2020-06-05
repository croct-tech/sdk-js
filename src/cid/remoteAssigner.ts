import {Logger} from '../logging/index';
import NullLogger from '../logging/nullLogger';
import {formatCause} from '../error';
import CidAssigner from './index';

export default class RemoteAssigner implements CidAssigner {
    private readonly logger: Logger;

    private readonly endpoint: string;

    private pending?: Promise<string>;

    public constructor(endpoint: string, logger?: Logger) {
        this.endpoint = endpoint;
        this.logger = logger ?? new NullLogger();
    }

    public assignCid(): Promise<string> {
        if (this.pending === undefined) {
            this.pending = this.fetchCid().finally(() => {
                this.pending = undefined;
            });
        }

        return this.pending;
    }

    private async fetchCid(): Promise<string> {
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
