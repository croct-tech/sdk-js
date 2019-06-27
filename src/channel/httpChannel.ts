import {Logger} from '../logger';
import {ChannelListener, DuplexChannel} from '../channel';
import {NullLogger} from '../logger/nullLogger';

type Options = Omit<RequestInit, 'body' | 'signal'> & {
    timeout?: number
};

type Configuration = Options & {
    url: string,
    logger?: Logger
}

type RequestBody = BodyInit;

export class HttpChannel implements DuplexChannel<Response, RequestBody> {
    private readonly url: string;
    private readonly logger: Logger;
    private readonly options: Options;
    private readonly listeners: ChannelListener<Response>[] = [];

    constructor({url, logger, ...options}: Configuration) {
        this.url = url;
        this.logger = logger || new NullLogger();
        this.options = options;
    }

    publish(message: RequestBody): Promise<void> {
        const {timeout, ...options}: Options = this.options;

        this.logger.info(`Sending HTTP ${options.method || 'GET'} request...`);

        const promise = window.fetch(this.url, {
            body: message,
            ...options,
        });

        return new Promise((resolve, reject) => {
            let abortTimer: number | undefined;
            let aborted = false;

            if (timeout !== undefined && timeout > 0) {
                const abort = () => {
                    this.logger.info(`Maximum request time exceed`);

                    aborted = true;
                    reject();
                };

                abortTimer = window.setTimeout(abort, timeout);
            }

            const handleResponse = (response: Response) => {
                if (aborted) {
                    return;
                }

                window.clearTimeout(abortTimer);

                const status = `${response.status} ${response.statusText}`;

                if (!response.ok) {
                    this.logger.error(`Request failed with status ${status}`);

                    reject();

                    return;
                }

                this.logger.info(`Request succeeded with status ${status}`);

                resolve();

                for (const dispatch of this.listeners) {
                    dispatch(response);
                }
            };

            promise.then(handleResponse, error => {
                this.logger.error(`Request error: ${error instanceof Error ? error.message : error}`);

                window.clearTimeout(abortTimer);

                reject();
            })
        });
    }

    subscribe(listener: ChannelListener<Response>): void {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    unsubscribe(listener: ChannelListener<Response>): void {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    close(): Promise<void> {
        return Promise.resolve();
    }
}
