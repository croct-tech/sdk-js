import {ChannelListener, DuplexChannel, MessageDeliveryError} from './channel';
import {Envelope} from './guaranteedChannel';
import {Logger, NullLogger} from '../logging';
import {CidAssigner} from '../cid';
import {formatMessage} from '../error';
import {CLIENT_LIBRARY} from '../constants';
import {Help} from '../help';

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
            return Promise.reject(MessageDeliveryError.nonRetryable('Channel is closed'));
        }

        const {token, timestamp, context, payload} = JSON.parse(message);
        const {endpointUrl, appId, cidAssigner} = this.configuration;

        return fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'X-App-Id': appId,
                'X-Client-Id': await cidAssigner.assignCid(),
                'X-Client-Library': CLIENT_LIBRARY,
                'Content-Type': 'application/json',
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

            const isRetryable = HttpBeaconChannel.isRetryable(problem.status);
            const help = Help.forStatusCode(problem.status);

            if (help !== undefined) {
                this.logger.error(help);
            } else if (!isRetryable) {
                this.logger.error(`Beacon rejected with non-retryable status: ${problem.title}`);
            }

            return Promise.reject(
                isRetryable
                    ? MessageDeliveryError.retryable(problem.title)
                    : MessageDeliveryError.nonRetryable(problem.title),
            );
        }).catch(error => {
            this.logger.error(`Failed to publish beacon: ${formatMessage(error)}`);

            return Promise.reject(
                error instanceof MessageDeliveryError
                    ? error
                    : MessageDeliveryError.retryable(error),
            );
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

    private static isRetryable(status: number): boolean {
        // Retry on any server error and client errors 429 (rate limit) and 408 (request timeout)
        return status >= 500 || status === 429 || status === 408;
    }
}
