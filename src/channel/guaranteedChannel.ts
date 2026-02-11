import type {Logger} from '../logging';
import {NullLogger} from '../logging';
import type {DuplexChannel, OutputChannel} from './channel';
import {MessageDeliveryError} from './channel';

export type MessageStamper<M, S> = {
    generate(message: M): S,
};

export class TimeStamper implements MessageStamper<any, string> {
    public generate(): string {
        return String(Date.now());
    }
}

export type Envelope<M, S> = {
    id: S,
    message: M,
};

type Options = {
    ackTimeout: number,
};

type Configuration<M, S> = Partial<Options> & {
    channel: DuplexChannel<S, Envelope<M, S>>,
    stamper: MessageStamper<M, S>,
    logger?: Logger,
};

export class GuaranteedChannel<M, S> implements OutputChannel<M> {
    private readonly channel: DuplexChannel<S, Envelope<M, S>>;

    private readonly stamper: MessageStamper<M, S>;

    private readonly logger: Logger;

    private readonly options: Options;

    private closed = false;

    public constructor({channel, logger, stamper, ...options}: Configuration<M, S>) {
        this.channel = channel;
        this.logger = logger ?? new NullLogger();
        this.stamper = stamper;
        this.options = {
            ...options,
            ackTimeout: options.ackTimeout ?? 5000,
        };
    }

    public publish(message: M): Promise<void> {
        if (this.closed) {
            return Promise.reject(MessageDeliveryError.nonRetryable('Channel is closed.'));
        }

        return new Promise((resolve, reject): void => {
            const id = this.stamper.generate(message);

            let timeoutTimer: number;
            let closeWatcher: number;
            let confirmed = false;
            const start = Date.now();

            const acknowledge = (response: any): void => {
                if (response === id) {
                    confirmed = true;

                    const elapsed = Date.now() - start;

                    window.clearTimeout(timeoutTimer);
                    window.clearInterval(closeWatcher);

                    this.logger.debug(`Delivery confirmed #${id}, elapsed ${elapsed}ms.`);

                    this.channel.unsubscribe(acknowledge);

                    resolve();
                }
            };

            this.channel.subscribe(acknowledge);

            const abort = (error: Error): void => {
                window.clearTimeout(timeoutTimer);
                window.clearInterval(closeWatcher);

                this.logger.error(`Failed to send message #${id}`);

                this.channel.unsubscribe(acknowledge);

                reject(error);
            };

            const wait = (): void => {
                if (confirmed) {
                    return;
                }

                closeWatcher = window.setInterval(
                    () => {
                        if (this.closed) {
                            // Cancel delay immediately when the channel is closed
                            abort(MessageDeliveryError.retryable('Connection deliberately closed.'));
                        }
                    },
                    0,
                );

                this.logger.debug(`Waiting confirmation #${id}...`);

                timeoutTimer = window.setTimeout(
                    () => {
                        abort(MessageDeliveryError.retryable('Maximum confirmation time reached.'));
                    },
                    this.options.ackTimeout,
                );
            };

            this.logger.debug(`Sending message #${id}...`);

            this.channel
                .publish({id: id, message: message})
                .then(wait, abort);
        });
    }

    public close(): Promise<void> {
        this.closed = true;

        return this.channel.close();
    }
}
