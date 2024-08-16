import {ChannelListener, DuplexChannel} from './channel';
import {Envelope} from './guaranteedChannel';
import {Logger, NullLogger} from '../logging';
import {CidAssigner} from '../cid';
import {formatMessage} from '../error';
import {CLIENT_LIBRARY} from '../constants';

export type Configuration = {
    appId: string,
    endpointUrl: string,
    cidAssigner: CidAssigner,
    logger?: Logger,
};

type ApiProblem = {
    type: string,
    title: string,
    status: number,
    detail: string,
};

export class HttpBeaconChannel implements DuplexChannel<string, Envelope<string, string>> {
    private static readonly NON_RETRYABLE_STATUSES: ReadonlySet<number> = new Set([
        403, // API usage limit exceeded
        401, // Invalid token
    ]);

    private readonly configuration: Omit<Configuration, 'logger'>;

    private readonly logger: Logger;

    private readonly listeners: Array<ChannelListener<string>> = [];

    private closed = false;

    public constructor({logger = new NullLogger(), ...configuration}: Configuration) {
        this.configuration = configuration;
        this.logger = logger;
    }

    public async publish({id: receiptId, message}: Envelope<string, string>): Promise<void> {
        if (this.closed) {
            return Promise.reject(new Error('Channel is closed'));
        }

        const {token, timestamp, context, payload} = JSON.parse(message);
        const {endpointUrl, appId, cidAssigner} = this.configuration;

        return fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'X-App-Id': appId,
                'X-Client-Id': await cidAssigner.assignCid(),
                'X-Client-Library': CLIENT_LIBRARY,
                ...(token !== undefined ? {'X-Token': token} : {}),
            },
            body: JSON.stringify({
                context: context,
                payload: payload,
                originalTime: timestamp,
                departureTime: Date.now(),
            }),
        }).then(async response => {
            if (response.ok) {
                this.notify(receiptId);

                return;
            }

            const problem: ApiProblem = await response.json().catch(
                () => ({
                    type: 'https://croct.help/api/event-tracker#unexpected-error',
                    title: response.statusText,
                    status: response.status,
                }),
            );

            if (HttpBeaconChannel.NON_RETRYABLE_STATUSES.has(problem.status)) {
                this.logger.error(`Beacon rejected with non-retryable status: ${problem.title}`);

                this.notify(receiptId);

                return Promise.resolve();
            }

            return Promise.reject(new Error(problem.title));
        }).catch(error => {
            this.logger.error(`Failed to publish beacon: ${formatMessage(error)}`);

            return Promise.reject(error);
        });
    }

    public subscribe(listener: ChannelListener<string>): void {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    public unsubscribe(listener: ChannelListener<string>): void {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    private notify(receiptId: string): void {
        this.listeners.forEach(dispatch => dispatch(receiptId));
    }

    public close(): Promise<void> {
        this.closed = true;

        return Promise.resolve();
    }
}
