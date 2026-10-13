import type {ChannelListener, DuplexChannel} from './channel';
import {MessageDeliveryError} from './channel';
import type {Envelope} from './guaranteedChannel';
import type {Logger} from '../logging';
import {NullLogger} from '../logging';
import type {CidAssigner} from '../cid';
import {formatMessage} from '../error';
import {Help} from '../help';
import type {EventPublisher, PublishRequest} from '../eventPublisher';
import {PublishError} from '../eventPublisher';

export type Configuration = {
    publisher: EventPublisher,
    cidAssigner: CidAssigner,
    logger?: Logger,
};

/**
 * @deprecated Use `PublishErrorType` from the `eventPublisher` module instead.
 */
export enum TrackingErrorType {
    SUSPENDED_SERVICE = 'https://croct.help/sdk/javascript/suspended-service',
    // Server errors
    INTERNAL_ERROR = 'https://croct.help/api/event-tracking/internal-error',
}

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

        const {token, timestamp, context, payload: {type, ...payload}} = JSON.parse(message);
        const {publisher, cidAssigner} = this.configuration;

        const request: PublishRequest = {
            type: type,
            payload: payload,
            clientId: await cidAssigner.assignCid(),
            timestamp: timestamp,
            context: context,
            userToken: token,
        };

        return publisher.publish(request, {extra: {keepalive: true}})
            .then(
                () => this.notify(receiptId),
                (error: unknown) => {
                    if (!(error instanceof PublishError)) {
                        throw error;
                    }

                    const problem = error.response;
                    const isRetryable = HttpBeaconChannel.isRetryable(problem.status);

                    // The publisher already logs the help for known problems
                    if (!isRetryable && Help.forApiProblem(problem) === undefined) {
                        this.logger.error(`Beacon rejected with non-retryable status: ${problem.title}`);
                    }

                    return Promise.reject(
                        isRetryable
                            ? MessageDeliveryError.retryable(problem.title)
                            : MessageDeliveryError.nonRetryable(problem.title),
                    );
                },
            )
            .catch(error => {
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
