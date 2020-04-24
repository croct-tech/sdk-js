import Logger from '../logger';
import {ChannelListener, DuplexChannel} from '../channel';
import {formatCause} from '../error';
import NullLogger from '../logger/nullLogger';

type Input = string | ArrayBufferLike | Blob | ArrayBufferView;
type Output = string | ArrayBuffer | Blob;

type Options = {
    closeTimeout: number,
    connectionTimeout: number,
    protocols: string | string[],
    binaryType?: BinaryType,
};

export type Configuration = Partial<Options> & {
    url: string,
    logger?: Logger,
};

export class SocketChannel<I extends Input, O extends Output> implements DuplexChannel<I, O> {
    private readonly url: string;

    private readonly logger: Logger;

    private readonly options: Options;

    private readonly listeners: ChannelListener<I>[] = [];

    private connection?: Promise<WebSocket>;

    private closed = false;

    public constructor({url, logger, ...options}: Configuration) {
        this.url = url;
        this.logger = logger ?? new NullLogger();
        this.options = {
            ...options,
            closeTimeout: options.closeTimeout ?? 5000,
            connectionTimeout: options.connectionTimeout ?? 10000,
            protocols: options.protocols ?? [],
        };
    }

    public get connected(): Promise<boolean> {
        if (this.connection === undefined) {
            return Promise.resolve(false);
        }

        return this.connection.then(() => true, () => false);
    }

    public publish(message: O): Promise<void> {
        return this.connect().then(socket => {
            socket.send(message);

            this.logger.debug('Message sent.');
        });
    }

    public subscribe(listener: ChannelListener<I>): void {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    public unsubscribe(listener: ChannelListener<I>): void {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    private notify(message: I): void {
        this.listeners.forEach(dispatch => dispatch(message));
    }

    private connect(): Promise<WebSocket> {
        if (this.closed) {
            return Promise.reject(new Error('Channel has been closed.'));
        }

        if (this.connection !== undefined) {
            return this.connection.then(connection => {
                const state = connection.readyState;

                if (state === WebSocket.OPEN) {
                    return connection;
                }

                throw new Error('Connection lost.');
            }).catch(() => {
                // Reconnect
                delete this.connection;

                return this.connect();
            });
        }

        this.connection = new Promise((resolve, reject): void => {
            this.logger.debug('Connecting...');

            const connection = new window.WebSocket(this.url, this.options.protocols);

            if (this.options.binaryType) {
                connection.binaryType = this.options.binaryType;
            }

            const abortListener = (): void => {
                const reason = 'Maximum connection timeout reached.';

                this.logger.error(reason);

                reject(new Error(reason));

                connection.close(1000, reason);
            };

            const abortTimer: number = window.setTimeout(abortListener, this.options.connectionTimeout);

            const openListener = (): void => {
                window.clearTimeout(abortTimer);

                this.logger.info('Connection established.');

                connection.removeEventListener('open', openListener);

                resolve(connection);
            };

            const errorListener = (): void => {
                if (!this.closed) {
                    this.logger.error('Connection error.');
                }
            };

            const messageListener = (event: MessageEvent): void => {
                this.logger.debug('Message received.');

                this.notify(event.data);
            };

            const closeListener = (event: CloseEvent): void => {
                window.clearTimeout(abortTimer);

                const reason = `${formatCause(event.reason || 'unknown')} (code ${event.code})`;
                const message = `Connection has been closed, reason: ${reason}`;

                if (!this.closed) {
                    this.logger.info(message);
                }

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

        return this.connection;
    }

    public close(): Promise<void> {
        this.logger.debug('Closing connection...');

        return new Promise((resolve, reject): void => {
            this.closed = true;

            if (this.connection === undefined) {
                this.logger.debug('Connection is not open.');

                resolve();

                return;
            }

            this.connection.then(
                (connection): void => {
                    let abortTimer: number | undefined;

                    const abort = (): void => {
                        this.logger.warn('Connection could not be closed within the timeout period.');

                        reject(new Error('Maximum close timeout reached.'));
                    };

                    const close = (): void => {
                        window.clearTimeout(abortTimer);

                        this.logger.info('Connection gracefully closed.');

                        resolve();
                    };

                    connection.addEventListener('close', close, {once: true});
                    connection.close(1000, 'Deliberate disconnection.');

                    abortTimer = window.setTimeout(abort, this.options.closeTimeout);
                },
                () => {
                    this.logger.info('Connection closed.');

                    resolve();
                },
            );
        });
    }
}
