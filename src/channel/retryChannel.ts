import {MessageDeliveryError, OutputChannel} from './channel';
import {Logger, NullLogger} from '../logging';
import {RetryPolicy} from '../retry';

type Configuration<T> = {
    channel: OutputChannel<T>,
    retryPolicy: RetryPolicy<T>,
    logger?: Logger,
};

export class RetryChannel<T> implements OutputChannel<T> {
    private readonly channel: OutputChannel<T>;

    private readonly retryPolicy: RetryPolicy<T>;

    private readonly logger: Logger;

    private closed = false;

    public constructor({channel, retryPolicy, logger}: Configuration<T>) {
        this.channel = channel;
        this.retryPolicy = retryPolicy;
        this.logger = logger ?? new NullLogger();
    }

    public publish(message: T): Promise<void> {
        if (this.closed) {
            return Promise.reject(new MessageDeliveryError('The channel is closed.', false));
        }

        return this.channel
            .publish(message)
            .catch(error => this.retry(message, error));
    }

    public async retry(message: T, error: unknown): Promise<void> {
        if (error instanceof MessageDeliveryError && !error.retryable) {
            throw error;
        }

        let attempt = 0;

        while (this.retryPolicy.shouldRetry(attempt, message, error)) {
            if (this.closed) {
                throw new MessageDeliveryError('Connection deliberately closed.', false);
            }

            const delay = this.retryPolicy.getDelay(attempt);

            this.logger.debug(`Retry attempt ${attempt + 1}`);

            if (delay > 0) {
                this.logger.debug(`Retry attempt delayed in ${delay}ms`);

                await new Promise<void>((resolve, reject): void => {
                    const closeWatcher = window.setInterval(
                        () => {
                            if (this.closed) {
                                // Cancel delay immediately when the channel is closed
                                window.clearInterval(closeWatcher);

                                reject(new MessageDeliveryError('Connection deliberately closed.', false));
                            }
                        },
                        0,
                    );

                    window.setTimeout(
                        (): void => {
                            window.clearInterval(closeWatcher);

                            resolve();
                        },
                        delay,
                    );
                });
            }

            try {
                return await this.channel.publish(message);
            } catch {
                attempt += 1;
            }
        }

        throw new MessageDeliveryError('Maximum retry attempts reached.', false);
    }

    public close(): Promise<void> {
        this.closed = true;

        return this.channel.close();
    }
}
