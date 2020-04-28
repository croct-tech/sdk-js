import Logger from './logger';
import Context, {TokenScope} from './context';
import ConsoleLogger from './logger/consoleLogger';
import NullLogger from './logger/nullLogger';
import NamespacedStorage from './namespacedStorage';
import BackoffPolicy from './retryPolicy/backoffPolicy';
import {OutputChannel} from './channel';
import PersistentQueue from './queue/persistentQueue';
import {GuaranteedChannel, TimeStamper} from './channel/guaranteedChannel';
import QueuedChannel from './channel/queuedChannel';
import RetryChannel from './channel/retryChannel';
import MonitoredQueue from './queue/monitoredQueue';
import CapacityRestrictedQueue from './queue/capacityRestrictedQueue';
import EncodedChannel from './channel/encodedChannel';
import BeaconSocketChannel from './channel/beaconSocketChannel';
import {Beacon} from './event';
import {SocketChannel} from './channel/socketChannel';
import Token, {TokenProvider} from './token';
import Tracker from './tracker';
import Evaluator from './evaluator';
import NamespacedLogger from './logger/namespacedLogger';
import {encodeJson} from './transformer';

export type Configuration = {
    appId: string,
    tokenScope: TokenScope,
    debug: boolean,
    trackerEndpointUrl: string,
    evaluationEndpointUrl: string,
    bootstrapEndpointUrl: string,
    beaconQueueSize: number,
    logger?: Logger,
    eventMetadata?: {[key: string]: string},
};

export class Container {
    private readonly configuration: Configuration;

    private context: Context;

    private tracker: Tracker;

    private evaluator: Evaluator;

    private beaconChannel: OutputChannel<Beacon>;

    private beaconQueue: MonitoredQueue<string>;

    public constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    public getConfiguration(): Configuration {
        return this.configuration;
    }

    public getEvaluator(): Evaluator {
        if (this.evaluator === undefined) {
            this.evaluator = this.createEvaluator();
        }

        return this.evaluator;
    }

    private createEvaluator(): Evaluator {
        const context = this.getContext();

        return new Evaluator({
            appId: this.configuration.appId,
            endpointUrl: this.configuration.evaluationEndpointUrl,
            tokenProvider: new class implements TokenProvider {
                public getToken(): Promise<Token | null> {
                    return Promise.resolve(context.getToken());
                }
            }(),
        });
    }

    public getTracker(): Tracker {
        if (this.tracker === undefined) {
            this.tracker = this.createTracker();
        }

        return this.tracker;
    }

    private createTracker(): Tracker {
        const tracker = new Tracker({
            context: this.getContext(),
            logger: this.getLogger('Tracker'),
            channel: this.getBeaconChannel(),
            eventMetadata: this.configuration.eventMetadata || {},
        });

        const queue = this.getBeaconQueue();

        queue.addCallback('halfEmpty', tracker.unsuspend);
        queue.addCallback('full', tracker.suspend);

        return tracker;
    }

    public getContext(): Context {
        if (this.context === undefined) {
            this.context = this.createContext();
        }

        return this.context;
    }

    private createContext(): Context {
        return Context.load(
            this.getSessionStorage('context'),
            this.getApplicationStorage('context'),
            this.configuration.tokenScope,
        );
    }

    private getBeaconChannel(): OutputChannel<Beacon> {
        if (this.beaconChannel === undefined) {
            this.beaconChannel = this.createBeaconChannel();
        }

        return this.beaconChannel;
    }

    private createBeaconChannel(): OutputChannel<Beacon> {
        const channelLogger = this.getLogger('BeaconChannel');
        const {appId, trackerEndpointUrl, bootstrapEndpointUrl} = this.configuration;

        const queuedChannel = new QueuedChannel(
            new RetryChannel({
                channel: new GuaranteedChannel({
                    channel: new BeaconSocketChannel({
                        trackerEndpointUrl: `${trackerEndpointUrl}/${appId}`,
                        bootstrapEndpointUrl: bootstrapEndpointUrl,
                        tokenParameter: 'token',
                        loggerFactory: this.getLogger.bind(this),
                        logger: channelLogger,
                        channelFactory: (url, logger): SocketChannel<any, any> => new SocketChannel({url, logger}),
                    }),
                    stamper: new TimeStamper(),
                    ackTimeout: 10000,
                    logger: channelLogger,
                }),
                retryPolicy: new BackoffPolicy({
                    minRetryDelay: 1000, // 1 second
                    maxRetryDelay: 60 * 1000, // 60 seconds
                    backoffFactor: 1.5, // 1.5 ^ attempt
                    backoffJitter: 1, // add randomness
                }),
                logger: channelLogger,
            }),
            this.getBeaconQueue(),
            channelLogger,
        );

        queuedChannel.flush().catch(() => {
            // Suppress errors as they are already reported by the channel
        });

        return new EncodedChannel<Beacon, string>(queuedChannel, encodeJson);
    }

    public getBeaconQueue(): MonitoredQueue<string> {
        if (this.beaconQueue === undefined) {
            this.beaconQueue = this.createBeaconQueue();
        }

        return this.beaconQueue;
    }

    private createBeaconQueue(): MonitoredQueue<string> {
        const context = this.getContext();
        const tab = context.getTab();

        return new MonitoredQueue<string>(
            new CapacityRestrictedQueue(
                new PersistentQueue(this.getSessionStorage('queue'), tab.id),
                this.configuration.beaconQueueSize,
            ),
            this.getLogger('BeaconQueue'),
        );
    }

    public getLogger(...namespace: string[]): Logger {
        const prefix = `Croct${namespace.length === 0 ? '' : `:${namespace.join(':')}`}`;

        if (this.configuration.logger !== undefined) {
            return new NamespacedLogger(this.configuration.logger, prefix);
        }

        if (this.configuration.debug) {
            return new ConsoleLogger(prefix);
        }

        return new NullLogger();
    }

    private getSessionStorage(namespace: string): Storage {
        return new NamespacedStorage(sessionStorage, this.resolveStorageNamespace(namespace));
    }

    private getApplicationStorage(namespace: string): Storage {
        return new NamespacedStorage(localStorage, this.resolveStorageNamespace(namespace));
    }

    private resolveStorageNamespace(namespace: string): string {
        return `${this.configuration.appId.toLowerCase()}.${namespace}`;
    }

    public async dispose(): Promise<void> {
        const logger = this.getLogger();

        if (this.beaconChannel) {
            logger.debug('Closing beacon channel...');

            await this.beaconChannel.close();
        }

        if (this.tracker) {
            if (this.beaconQueue) {
                logger.debug('Removing queue listeners...');

                this.beaconQueue.removeCallback('halfEmpty', this.tracker.unsuspend);
                this.beaconQueue.removeCallback('full', this.tracker.suspend);
            }

            logger.debug('Suspending tracker...');

            this.tracker.suspend();

            await this.tracker.flushed;
        }

        delete this.context;
        delete this.tracker;
        delete this.evaluator;
        delete this.beaconChannel;
        delete this.beaconQueue;

        logger.debug('Container resources released.');
    }
}
