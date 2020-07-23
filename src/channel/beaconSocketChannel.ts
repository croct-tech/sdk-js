import {ChannelListener, DuplexChannel} from './index';
import {Envelope} from './guaranteedChannel';
import {Logger, LoggerFactory} from '../logging';
import NullLogger from '../logging/nullLogger';
import CidAssigner from '../cid';

export interface DuplexChannelFactory {
    (url: string, logger: Logger): DuplexChannel<string, string>;
}

type Configuration = {
    logger?: Logger,
    loggerFactory?: LoggerFactory,
    tokenParameter: string,
    trackerEndpointUrl: string,
    channelFactory: DuplexChannelFactory,
    cidAssigner: CidAssigner,
    cidParameter: string,
};

type Violation = {
    message: string,
    path: string,
};

type Confirmation = {
    receiptId: string | null,
    violations?: Violation[],
};

export default class BeaconSocketChannel implements DuplexChannel<string, Envelope<string, string>> {
    private readonly socketFactory: DuplexChannelFactory;

    private readonly logger: Logger;

    private readonly loggerFactory: LoggerFactory;

    private readonly cidAssigner: CidAssigner;

    private readonly cidParameter: string;

    private readonly tokenParameter: string;

    private readonly trackerEndpointUrl: string;

    private readonly listeners: ChannelListener<string>[] = [];

    private socketChannel?: DuplexChannel<string, string>;

    private token?: string;

    private connectionIndex = 0;

    public constructor(configuration: Configuration) {
        this.socketFactory = configuration.channelFactory;
        this.logger = configuration.logger ?? new NullLogger();
        this.loggerFactory = configuration.loggerFactory ?? ((): Logger => new NullLogger());
        this.cidAssigner = configuration.cidAssigner;
        this.cidParameter = configuration.cidParameter;
        this.trackerEndpointUrl = configuration.trackerEndpointUrl;
        this.tokenParameter = configuration.tokenParameter;
        this.notify = this.notify.bind(this);
    }

    public async publish({id: receiptId, message}: Envelope<string, string>): Promise<void> {
        const {token, timestamp, context, payload} = JSON.parse(message);

        if (this.token !== token || this.socketChannel === undefined) {
            if (this.socketChannel !== undefined) {
                this.logger.info('Connection no longer valid for current message.');

                this.socketChannel.unsubscribe(this.notify);

                await this.socketChannel.close();
            }

            this.token = token;
            this.socketChannel = await this.createSocketChannel(token);
        }

        return this.socketChannel.publish(
            JSON.stringify({
                receiptId: receiptId,
                originalTime: timestamp,
                departureTime: Date.now(),
                context: context,
                payload: payload,
            }),
        );
    }

    private async createSocketChannel(token?: string): Promise<DuplexChannel<string, string>> {
        const endpoint = new URL(this.trackerEndpointUrl);
        endpoint.searchParams.append(this.cidParameter, await this.cidAssigner.assignCid());

        if (token !== undefined) {
            endpoint.searchParams.append(this.tokenParameter, token);
        }

        const channel: DuplexChannel<string, string> = this.socketFactory(
            endpoint.toString(),
            this.loggerFactory(`WebSocket#${this.connectionIndex}`),
        );

        this.connectionIndex += 1;

        channel.subscribe(this.notify);

        return channel;
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

    private notify(message: string): void {
        let confirmation: Confirmation;

        try {
            confirmation = JSON.parse(message);
        } catch {
            this.logger.error('Invalid JSON message received.');

            return;
        }

        const {violations = [], receiptId} = confirmation;

        violations.forEach(violation => this.logger.error(violation.message));

        if (receiptId !== null) {
            this.listeners.forEach(dispatch => dispatch(receiptId));
        }
    }

    public close(): Promise<void> {
        if (this.socketChannel === undefined) {
            return Promise.resolve();
        }

        return this.socketChannel.close();
    }
}
