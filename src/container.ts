import {Logger, ConsoleLogger, NamespacedLogger} from './logging';
import {Context, TokenScope} from './context';
import {NamespacedStorage} from './namespacedStorage';
import {BackoffPolicy, ArbitraryPolicy} from './retry';
import {PersistentQueue, MonitoredQueue, CapacityRestrictedQueue} from './queue';
import {Beacon} from './trackingEvents';
import {CachedTokenStore, TokenStore} from './token';
import {Tracker, TrackingEventProcessor} from './tracker';
import {Evaluator} from './evaluator';
import {encodeJson} from './transformer';
import {CidAssigner, CachedAssigner, RemoteAssigner, FixedAssigner} from './cid';
import {EventManager, SynchronousEventManager} from './eventManager';
import {SdkEventMap} from './sdkEvents';
import {LocalStorageCache} from './cache';
import {UrlSanitizer} from './tab';
import {TimeStamper} from './channel/guaranteedChannel';
import {
    OutputChannel,
    QueuedChannel,
    RetryChannel,
    GuaranteedChannel,
    EncodedChannel,
    SandboxChannel,
} from './channel';
import {ContentFetcher} from './contentFetcher';
import {CookieCache, CookieCacheConfiguration} from './cache/cookieCache';
import {FilteredLogger} from './logging/filteredLogger';
import {HttpBeaconChannel} from './channel/httpBeaconChannel';

export type DependencyResolver<T> = (container: Container) => T;

export type Configuration = {
    appId: string,
    tokenScope: TokenScope,
    clientId?: string,
    debug: boolean,
    test: boolean,
    disableCidMirroring: boolean,
    cidAssignerEndpointUrl: string,
    trackerEndpointUrl: string,
    evaluationBaseEndpointUrl: string,
    contentBaseEndpointUrl: string,
    beaconQueueSize: number,
    logger?: Logger,
    urlSanitizer?: UrlSanitizer,
    cookie?: {
        clientId?: CookieCacheConfiguration,
        userToken?: CookieCacheConfiguration,
        previewToken?: CookieCacheConfiguration,
    },
    eventMetadata?: {[key: string]: string},
    eventProcessor?: DependencyResolver<TrackingEventProcessor>,
};

export class Container {
    private readonly configuration: Configuration;

    private context?: Context;

    private userTokenProvider?: TokenStore;

    private previewTokenStore?: TokenStore;

    private tracker?: Tracker;

    private evaluator?: Evaluator;

    private contentFetcher?: ContentFetcher;

    private cidAssigner?: CidAssigner;

    private beaconChannel?: OutputChannel<Beacon>;

    private beaconQueue?: MonitoredQueue<string>;

    private removeTokenSyncListener?: {(): void};

    private readonly eventManager = new SynchronousEventManager<SdkEventMap>();

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
        return new Evaluator({
            appId: this.configuration.appId,
            baseEndpointUrl: this.configuration.evaluationBaseEndpointUrl,
            logger: this.getLogger('Evaluator'),
        });
    }

    public getContentFetcher(): ContentFetcher {
        if (this.contentFetcher === undefined) {
            this.contentFetcher = this.createContentFetcher();
        }

        return this.contentFetcher;
    }

    private createContentFetcher(): ContentFetcher {
        return new ContentFetcher({
            appId: this.configuration.appId,
            baseEndpointUrl: this.configuration.contentBaseEndpointUrl,
            logger: this.getLogger('ContentFetcher'),
        });
    }

    public getPreviewTokenStore(): TokenStore {
        if (this.previewTokenStore === undefined) {
            this.previewTokenStore = new CachedTokenStore(
                this.configuration.cookie?.previewToken !== undefined
                    ? new CookieCache(this.configuration.cookie.previewToken)
                    : new LocalStorageCache(this.getGlobalBrowserStorage('preview'), 'token'),
            );
        }

        return this.previewTokenStore;
    }

    public getTracker(): Tracker {
        if (this.tracker === undefined) {
            this.tracker = this.createTracker();
        }

        return this.tracker;
    }

    private createTracker(): Tracker {
        const context = this.getContext();

        const tracker = new Tracker({
            tab: context.getTab(),
            tokenProvider: this.getUserTokenStore(),
            inactivityRetryPolicy: new ArbitraryPolicy([30_000, 30_000, 120_000, 120_000, 300_000, 300_000, 900_000]),
            logger: this.getLogger('Tracker'),
            channel: this.getBeaconChannel(),
            eventMetadata: this.configuration.eventMetadata,
            processor: this.configuration.eventProcessor === undefined
                ? undefined
                : this.configuration.eventProcessor(this),
        });

        const queue = this.getBeaconQueue();

        queue.addCallback('halfEmpty', tracker.unsuspend);
        queue.addCallback('full', tracker.suspend);

        return tracker;
    }

    public getUserTokenStore(): TokenStore {
        if (this.userTokenProvider === undefined) {
            const context = this.getContext();

            this.userTokenProvider = {
                getToken: context.getToken.bind(context),
                setToken: context.setToken.bind(context),
            };
        }

        return this.userTokenProvider;
    }

    public getContext(): Context {
        if (this.context === undefined) {
            this.context = this.createContext();
        }

        return this.context;
    }

    private createContext(): Context {
        const tokenKey = this.resolveStorageNamespace('token');
        const tabKey = this.resolveStorageNamespace('tab');
        const browserCache = this.configuration.tokenScope === 'global'
            && this.configuration.cookie?.userToken !== undefined
            ? new CookieCache(this.configuration.cookie.userToken)
            : new LocalStorageCache(this.getLocalStorage(), tokenKey);
        const tabStorage = this.getSessionStorage();

        if (browserCache instanceof LocalStorageCache) {
            this.removeTokenSyncListener = LocalStorageCache.autoSync(browserCache);
        }

        return Context.load({
            tokenScope: this.configuration.tokenScope,
            eventDispatcher: this.getEventManager(),
            urlSanitizer: this.configuration.urlSanitizer,
            cache: {
                tabId: new LocalStorageCache(tabStorage, tabKey),
                tabToken: new LocalStorageCache(tabStorage, tokenKey),
                browserToken: browserCache,
            },
        });
    }

    private getBeaconChannel(): OutputChannel<Beacon> {
        if (this.beaconChannel === undefined) {
            this.beaconChannel = this.createBeaconChannel();
        }

        return this.beaconChannel;
    }

    private createBeaconChannel(): OutputChannel<Beacon> {
        if (this.configuration.test) {
            return new SandboxChannel();
        }

        const channelLogger = this.getLogger('BeaconChannel');
        const {appId, trackerEndpointUrl} = this.configuration;

        const queuedChannel = new QueuedChannel(
            new RetryChannel({
                channel: new GuaranteedChannel({
                    channel: new HttpBeaconChannel({
                        appId: appId,
                        endpointUrl: trackerEndpointUrl,
                        cidAssigner: this.getCidAssigner(),
                        logger: channelLogger,
                    }),
                    stamper: new TimeStamper(),
                    ackTimeout: 10000,
                    logger: channelLogger,
                }),
                retryPolicy: new BackoffPolicy({
                    minRetryDelay: 3000, // 3 seconds
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

    public getCidAssigner(): CidAssigner {
        if (this.cidAssigner === undefined) {
            this.cidAssigner = this.createCidAssigner();
        }

        return this.cidAssigner;
    }

    private createCidAssigner(): CidAssigner {
        if (this.configuration.clientId !== undefined) {
            return new FixedAssigner(this.configuration.clientId);
        }

        if (this.configuration.test) {
            return new FixedAssigner('00000000-0000-0000-0000-000000000000');
        }

        const logger = this.getLogger('CidAssigner');

        return new CachedAssigner(
            new RemoteAssigner(this.configuration.cidAssignerEndpointUrl, logger),
            this.configuration.cookie?.clientId !== undefined
                ? new CookieCache(this.configuration.cookie?.clientId)
                : new LocalStorageCache(this.getLocalStorage(), 'croct.cid'),
            {
                logger: logger,
                mirror: !this.configuration.disableCidMirroring,
            },
        );
    }

    public getBeaconQueue(): MonitoredQueue<string> {
        if (this.beaconQueue === undefined) {
            this.beaconQueue = this.createBeaconQueue();
        }

        return this.beaconQueue;
    }

    private createBeaconQueue(): MonitoredQueue<string> {
        return new MonitoredQueue<string>(
            new CapacityRestrictedQueue(
                new PersistentQueue(this.getGlobalTabStorage('queue')),
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

        return FilteredLogger.include(new ConsoleLogger(), ['error', 'warn']);
    }

    public getTabStorage(namespace: string, ...subnamespace: string[]): Storage {
        return this.getGlobalTabStorage('external', namespace, ...subnamespace);
    }

    public getBrowserStorage(namespace: string, ...subnamespace: string[]): Storage {
        return this.getGlobalBrowserStorage('external', namespace, ...subnamespace);
    }

    private getGlobalTabStorage(namespace: string, ...subnamespace: string[]): Storage {
        return new NamespacedStorage(
            this.getSessionStorage(),
            this.resolveStorageNamespace(namespace, ...subnamespace),
        );
    }

    private getGlobalBrowserStorage(namespace: string, ...subnamespace: string[]): Storage {
        return new NamespacedStorage(
            this.getLocalStorage(),
            this.resolveStorageNamespace(namespace, ...subnamespace),
        );
    }

    private resolveStorageNamespace(namespace: string, ...subnamespace: string[]): string {
        const {appId} = this.configuration;

        return `croct[${appId.toLowerCase()}].${[namespace].concat(subnamespace).join('.')}`;
    }

    private getLocalStorage(): Storage {
        return localStorage;
    }

    private getSessionStorage(): Storage {
        return sessionStorage;
    }

    public getEventManager(): EventManager<SdkEventMap> {
        return this.eventManager;
    }

    public async dispose(): Promise<void> {
        const logger = this.getLogger();

        if (this.beaconChannel !== undefined) {
            logger.debug('Closing beacon channel...');

            await this.beaconChannel.close();
        }

        if (this.removeTokenSyncListener !== undefined) {
            logger.debug('Removing token sync listener...');

            this.removeTokenSyncListener();
        }

        if (this.tracker !== undefined) {
            if (this.beaconQueue !== undefined) {
                logger.debug('Removing queue listeners...');

                this.beaconQueue.removeCallback('halfEmpty', this.tracker.unsuspend);
                this.beaconQueue.removeCallback('full', this.tracker.suspend);
            }

            logger.debug('Suspending tracker...');

            this.tracker.suspend();

            await this.tracker.flushed;
        }

        delete this.context;
        delete this.userTokenProvider;
        delete this.previewTokenStore;
        delete this.cidAssigner;
        delete this.tracker;
        delete this.evaluator;
        delete this.contentFetcher;
        delete this.beaconChannel;
        delete this.beaconQueue;
        delete this.removeTokenSyncListener;

        logger.debug('Container resources released.');
    }
}
