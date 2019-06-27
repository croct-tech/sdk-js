import {OutputChannel} from '../channel';
import {Logger} from '../logger';
import {RetryPolicy} from '../retryPolicy';
import {NullLogger} from '../logger/nullLogger';

type Configuration<T> = {
    channel: OutputChannel<T>
    retryPolicy: RetryPolicy<T>
    logger?: Logger
}

export class FaultTolerantChannel<T> implements OutputChannel<T> {
    private readonly channel: OutputChannel<T>;
    private readonly retryPolicy: RetryPolicy<T>;
    private readonly logger: Logger;
    private closed: boolean = false;

    constructor({channel, retryPolicy, logger} : Configuration<T>) {
        this.channel = channel;
        this.retryPolicy = retryPolicy;
        this.logger = logger || new NullLogger();
    }

    publish(message: T): Promise<void> {
        return this.channel.publish(message)
            .catch(error => this.retry(message, error));
    }

    async retry(message: T, error: any): Promise<void> {
        this.logger.info('Resending message...');

        let attempt = 0;

        while (this.retryPolicy.shouldRetry(attempt, message, error)) {
            if (this.closed) {
                throw new Error('Channel is closed');
            }

            const delay = this.retryPolicy.getDelay(attempt);

            this.logger.log(`Resend attempt ${attempt + 1}`);

            if (delay > 0) {
                this.logger.log(`Resend attempt delayed in ${delay} ms`);

                await new Promise(done => window.setTimeout(done, delay));
            }

            try {
                return await this.channel.publish(message);
            } catch {
                attempt++;
            }
        }

        throw new Error('Maximum resend attempts reached');
    }

    close(): Promise<void> {
        this.closed = true;

        return this.channel.close();
    }
}