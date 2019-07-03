import {Logger} from '../logger';
import {DuplexChannel, OutputChannel} from '../channel';
import {NullLogger} from '../logger/nullLogger';
import {formatCause} from '../error';

export type MessageStamper<M, S> = {
    generate(message: M): S
}

export class TimeStamper implements MessageStamper<any, string> {
    generate(message: any) : string {
        return String(Date.now());
    }
}

export type Envelope<M, S> = {
    id: S
    message: M
}

type Options = {
    ackTimeout: number
}

type Configuration<M, S> = Partial<Options> & {
    channel: DuplexChannel<S, Envelope<M, S>>
    stamper: MessageStamper<M, S>
    logger?: Logger
}

export class GuaranteedChannel<M, S> implements OutputChannel<M> {
    private readonly channel: DuplexChannel<S, Envelope<M, S>>;
    private readonly stamper: MessageStamper<M, S>;
    private readonly logger: Logger;
    private readonly options: Options;

    constructor({channel, logger, stamper, ...options}: Configuration<M, S>) {
        this.channel = channel;
        this.logger = logger || new NullLogger();
        this.stamper = stamper;
        this.options = {
            ackTimeout: 5000,
            ...options,
        };
    }

    publish(message: M): Promise<void> {
        return new Promise((resolve, reject): void => {
            const id = this.stamper.generate(message);

            let timeoutTimer: number;
            let confirmed = false;

            const acknowledge = (response: any): void => {
                if (response === id) {
                    confirmed = true;

                    window.clearTimeout(timeoutTimer);

                    this.logger.info(`Delivery confirmed #${id}`);

                    this.channel.unsubscribe(acknowledge);

                    resolve();
                }
            };

            this.channel.subscribe(acknowledge);

            const abort = (error: any) => {
                window.clearTimeout(timeoutTimer);

                this.logger.info(`Failed to send message #${id}: ${formatCause(error)}`);

                this.channel.unsubscribe(acknowledge);

                reject(error);
            };

            const wait = () => {
                if (confirmed) {
                    return;
                }

                this.logger.info(`Waiting confirmation #${id}...`);

                timeoutTimer = window.setTimeout(
                    () => abort(new Error('Maximum confirmation time reached')),
                    this.options.ackTimeout,
                );
            };

            this.logger.info(`Sending message #${id}...`);

            this.channel
                .publish({id: id, message: message})
                .then(wait, abort);
        });
    }

    close(): Promise<void> {
        return this.channel.close();
    }
}