import Tracker from './tracker';
import {Logger} from './logger';
import {Context, TokenScope} from './context';
import {ConsoleLogger} from './logger/consoleLogger';
import {PrefixedLogger} from './logger/prefixedLogger';
import {NullLogger} from './logger/nullLogger';
import {NamespacedStorage} from './namespacedStorage';
import {BackoffPolicy} from './retryPolicy/backoffPolicy';
import {OutputChannel} from './channel';
import {Beacon} from './beacon';
import {SocketChannel} from './channel/socketChannel';
import {CodecChannel} from './channel/codecChannel';
import {PersistentQueue} from './queue/persistentQueue';
import {GuaranteedChannel, TimeStamper} from './channel/guaranteedChannel';
import {compressJson} from './transformer';
import {QueuedChannel} from './channel/queuedChannel';
import {FaultTolerantChannel} from './channel/faultTolerantChannel';
import {MonitoredQueue} from './queue/monitoredQueue';
import queue from 'jest-websocket-mock/lib/queue';
import {CapacityRestrictedQueue} from './queue/capacityRestrictedQueue';
import {EncodedChannel} from './channel/encodedChannel';

export const VERSION = '1.0.0';

export type Options = {
    storageNamespace?: string;
    tokenScope?: TokenScope;
    debug?: boolean;
}

export default class Sdk {
    private static SINGLETON: Sdk;
    private static readonly APPLICATION_ID = Sdk.getApplicationId();

    private readonly options: Required<Options>;
    private context: Context;
    private logger: Logger;
    private tracker: Tracker;
    private beaconChannel: OutputChannel<Beacon>;
    private beaconQueue: MonitoredQueue<string>;

    private constructor(options: Options) {
        this.options = {
            storageNamespace: 'croct',
            tokenScope: 'global',
            debug: false,
            ...options,
        };

        this.initialize();
    }

    private static getApplicationId() : string {
        return window.btoa(window.location.hostname)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    private static get instance(): Sdk {
        if (!Sdk.SINGLETON) {
            throw new Error('Croct SDK is not installed');
        }

        return Sdk.SINGLETON;
    }

    static install(options: Options): void {
        if (Sdk.SINGLETON) {
            throw new Error('The SDK is already installed');
        }

        Sdk.SINGLETON = new Sdk(options);
    }

    static uninstall(): void {
        if (!Sdk.SINGLETON) {
            return;
        }

        Sdk.SINGLETON.destroy();

        delete Sdk.SINGLETON;
    }

    static get tracker(): Tracker {
        return Sdk.instance.getTracker();
    }

    private initialize(): void {
        const logger = this.getLogger();

        logger.info('Croct SDK installed');
        logger.info(`Application ID: ${Sdk.APPLICATION_ID}`);

        const context = this.getContext();
        const tab = context.getTab();

        logger.info('Context initialized');
        logger.log(`Token scope: ${this.options.tokenScope}`);
        logger.log(`${tab.isNew ? 'New' : 'Current'} tab: ${tab.id}`);
    }

    private destroy(): void {
        if (this.tracker) {
            this.tracker.disable();
        }

        const logger = this.getLogger();

        if (this.beaconChannel) {
            this.beaconChannel.close().catch(() =>
                logger.info('Failed to close beacon channel'),
            );
        }

        logger.info('Croct SDK uninstalled');
    }

    private getTracker(): Tracker {
        if (!this.tracker) {
            this.tracker = this.createTracker();
        }

        return this.tracker;
    }

    private createTracker() : Tracker {
        const tracker = new Tracker({
            context: this.getContext(),
            logger: this.getLogger('Tracker'),
            channel: this.getBeaconChannel(),
            version: VERSION
        });

        const queue = this.getBeaconQueue();

        queue.addCallback('halfEmpty', tracker.unsuspend.bind(tracker));
        queue.addCallback('full', tracker.suspend.bind(tracker));

        return tracker;
    }

    private getContext(): Context {
        if (!this.context) {
            this.context = this.createContext();
        }

        return this.context;
    }

    private createContext(): Context {
        return Context.initialize(
            this.getTabStorage('context'),
            this.getGlobalStorage('context'),
            this.options.tokenScope,
        );
    }

    private getLogger(prefix?: string): Logger {
        if (this.logger === undefined) {
            this.logger = this.createLogger();
        }

        if (prefix) {
            return new PrefixedLogger(this.logger, prefix);
        }

        return this.logger;
    }

    private createLogger(): Logger {
        return this.options.debug ? new ConsoleLogger() : new NullLogger();
    }

    private getBeaconChannel(): OutputChannel<Beacon> {
        if (!this.beaconChannel) {
            this.beaconChannel = this.createBeaconChannel();
        }

        return this.beaconChannel;
    }

    private createBeaconChannel(): OutputChannel<Beacon> {
        const logger = this.getLogger('BeaconChannel');

        return new EncodedChannel<Beacon, string>(
            new QueuedChannel(
                new FaultTolerantChannel({
                    channel: new GuaranteedChannel({
                        channel: new CodecChannel(
                            new SocketChannel({
                                url: `ws://localhost:8443/track/11c7f7c7-5e6c-48f6-a74f-7eb852c749f2`,
                                retryPolicy: new BackoffPolicy(),
                                logger: logger
                            }),
                            evenlope => Promise.resolve(`${evenlope.id}|${Date.now()}|${evenlope.message}`),
                            receipt => Promise.resolve(receipt)
                        ),
                        stamper: new TimeStamper(),
                        ackTimeout: 5000,
                        logger: logger,
                    }),
                    retryPolicy: new BackoffPolicy(),
                    logger: logger,
                }),
                this.getBeaconQueue(),
                logger,
            ),
            compressJson
        );
    }

    private getBeaconQueue() : MonitoredQueue<string> {
        if (!this.beaconQueue) {
            this.beaconQueue = this.createBeaconQueue();
        }

        return this.beaconQueue;
    }

    private createBeaconQueue() : MonitoredQueue<string> {
        const context = this.getContext();
        const tab = context.getTab();

        return new MonitoredQueue<string>(
            new CapacityRestrictedQueue(
                new PersistentQueue(
                    this.getTabStorage('queue'),
                    tab.id,
                ),
                10
            ),
            this.getLogger('BeaconQueue')
        );
    }

    private getTabStorage(namespace: string): Storage {
        return new NamespacedStorage(
            sessionStorage,
            this.resolveStorageNamespace(namespace),
        );
    }

    private getGlobalStorage(namespace: string): Storage {
        return new NamespacedStorage(
            localStorage,
            this.resolveStorageNamespace(namespace),
        );
    }

    private resolveStorageNamespace(namespace: string): string {
        let prefix = this.options.storageNamespace;

        if (prefix !== '') {
            prefix += '.';
        }

        return prefix + namespace;
    }
}