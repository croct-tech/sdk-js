import {RetryPolicy} from '../retryPolicy';
import {Logger} from '../logger';
import {ChannelListener, DuplexChannel} from '../channel';
import {NullLogger} from '../logger/nullLogger';
import {NeverPolicy} from '../retryPolicy/neverPolicy';
import {formatCause} from '../error';

type Input = string | ArrayBufferLike | Blob | ArrayBufferView;
type Output = string | ArrayBuffer | Blob;

type Options = {
    closeTimeout: number
    connectionTimeout: number
    protocols: string | string[]
    binaryType?: BinaryType
}

type Configuration = Partial<Options> & {
    url: string
    logger?: Logger
    retryPolicy?: RetryPolicy<CloseEvent>
}

export class SocketChannel<I extends Input, O extends Output> implements DuplexChannel<I, O> {
    private readonly url: string;
    private readonly retryPolicy: RetryPolicy<CloseEvent>;
    private readonly logger: Logger;
    private readonly options: Options;
    private readonly listeners: ChannelListener<I>[] = [];
    private closed: boolean = false;
    private connection: Promise<WebSocket>;
    private queue: Promise<void> = Promise.resolve();

    constructor({url, retryPolicy, logger, ...options}: Configuration) {
        this.url = url;
        this.retryPolicy = retryPolicy || new NeverPolicy();
        this.logger = logger || new NullLogger();
        this.options = {
            closeTimeout: 5000,
            connectionTimeout: 10000,
            protocols: [],
            ...options,
        };

        this.initialize();
    }

    get connected(): Promise<boolean> {
        return this.connection.then(() => true, () => false);
    }

    publish(message: O): Promise<void> {
        return this.queue = this.queue.finally(() => {
            return this.connection.then(connection => {
                connection.send(message);

                this.logger.info('Message sent');
            });
        });
    }

    subscribe(listener: ChannelListener<I>): void {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    unsubscribe(listener: ChannelListener<I>): void {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    private notify(message: I): void {
        for (const dispatch of this.listeners) {
            dispatch(message);
        }
    }

    private initialize(): void {
        const abort = (error: any) => this.logger.error(String(error));

        const configure = (connection: WebSocket) => {
            const reconnect = (event: CloseEvent) => {
                connection.removeEventListener('close', reconnect);

                this.connection = this.reconnect(event);
                this.connection.then(configure, abort);
            };

            connection.addEventListener('close', reconnect, {once: true});
        };

        this.connection = this.connect().catch(() => this.reconnect());
        this.connection.then(configure, abort);
    }

    private connect(): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            this.logger.info('Connecting...');

            const connection = new WebSocket(this.url, this.options.protocols);

            if (this.options.binaryType) {
                connection.binaryType = this.options.binaryType;
            }

            const abortListener = () => {
                this.logger.info('Maximum connection time reached');

                connection.close();
            };

            const abortTimer: number = window.setTimeout(
                abortListener,
                this.options.connectionTimeout,
            );

            const openListener = () => {
                window.clearTimeout(abortTimer);

                this.logger.info('Connection established');

                connection.removeEventListener('open', openListener);

                resolve(connection);
            };

            const errorListener = () => {
                this.logger.error(`Connection error`);
            };

            const messageListener = (event: MessageEvent) => {
                this.logger.info('Message received');

                this.notify(event.data);
            };

            const closeListener = (event: CloseEvent) => {
                window.clearTimeout(abortTimer);

                const reason = `${event.reason || 'unknown'} (code ${event.code})`;
                const message = `Connection has been closed, reason: ${reason}`;

                this.logger.info(message);

                connection.removeEventListener('open', openListener);
                connection.removeEventListener('error', errorListener);
                connection.removeEventListener('close', closeListener);
                connection.removeEventListener('message', messageListener);

                reject(new Error(message));
            };

            connection.addEventListener('open', openListener, {once: true});
            connection.addEventListener('close', closeListener, {once: true});
            connection.addEventListener('error', errorListener);
            connection.addEventListener('message', messageListener);
        });
    }

    private async reconnect(event?: CloseEvent): Promise<WebSocket> {
        this.logger.log('Reconnecting...');

        let attempt = 0;

        while (this.retryPolicy.shouldRetry(attempt, event)) {
            if (this.closed) {
                throw new Error('Channel is closed');
            }

            const delay = this.retryPolicy.getDelay(attempt);

            this.logger.log(`Reconnection attempt ${attempt + 1}`);

            if (delay > 0) {
                this.logger.log(`Reconnection attempt delayed in ${delay} ms`);

                await new Promise(done => window.setTimeout(done, delay));
            }

            try {
                return await this.connect();
            } catch {
                attempt++;
            }
        }

        throw new Error('Maximum reconnection attempts reached');
    }

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.then(
                connection => {
                    let abortTimer: number | undefined;

                    const abort = () => {
                        this.logger.info('Connection could not be closed within the timeout period');
                        reject();
                    };

                    const close = () => {
                        this.logger.info('Connection has been closed');

                        window.clearTimeout(abortTimer);
                        resolve();
                    };

                    this.closed = true;

                    connection.addEventListener('close', close, {once: true});
                    connection.close(1000, 'Deliberate disconnection');

                    abortTimer = window.setTimeout(abort, this.options.closeTimeout);
                },
                () => {
                    this.logger.info('Connection is already closed');

                    reject();
                },
            );
        });
    }
}