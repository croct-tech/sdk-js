import type {DependencyResolver} from './container';
import {Container} from './container';
import type {Context, TokenScope} from './context';
import type {Logger} from './logging';
import {BASE_ENDPOINT_URL, VERSION} from './constants';
import {sdkConfigurationSchema} from './schema';
import {formatCause} from './error';
import type {Tracker, TrackingEventProcessor} from './tracker';
import type {Evaluator} from './evaluator';
import type {SdkEventMap} from './sdkEvents';
import type {EventManager} from './eventManager';
import type {CidAssigner} from './cid';
import type {UrlSanitizer} from './tab';
import type {ContentFetcher} from './contentFetcher';
import type {TokenStore} from './token';
import type {CookieCacheConfiguration} from './cache/cookieCache';

export type Configuration = {
    appId: string,
    tokenScope: TokenScope,
    debug: boolean,
    test: boolean,
    clientId?: string,
    baseEndpointUrl?: string,
    disableCidMirroring: boolean,
    cidAssignerEndpointUrl?: string,
    beaconQueueSize?: number,
    urlSanitizer?: UrlSanitizer,
    logger?: Logger,
    eventMetadata?: {[key: string]: string},
    cookie?: {
        clientId?: CookieCacheConfiguration,
        userToken?: CookieCacheConfiguration,
        previewToken?: CookieCacheConfiguration,
    },
    eventProcessor?: DependencyResolver<TrackingEventProcessor>,
    defaultFetchTimeout?: number,
    defaultPreferredLocale?: string,
};

function validateConfiguration(configuration: unknown): asserts configuration is Configuration {
    if (typeof configuration !== 'object' || configuration === null) {
        throw new Error('The configuration must be a key-value map.');
    }

    try {
        sdkConfigurationSchema.validate(configuration);
    } catch (violation) {
        throw new Error(`Invalid configuration: ${formatCause(violation)}`);
    }
}

export class Sdk {
    private container: Container;

    private closed: boolean;

    private constructor(container: Container) {
        this.container = container;
    }

    public static init(configuration: Configuration): Sdk {
        validateConfiguration(configuration);

        const {
            eventMetadata: customMetadata = {},
            baseEndpointUrl = BASE_ENDPOINT_URL,
            cidAssignerEndpointUrl,
            ...containerConfiguration
        } = configuration;

        const eventMetadata: {[key: string]: string} = {
            sdkVersion: VERSION,
        };

        for (const metadata of Object.keys(customMetadata)) {
            eventMetadata[`custom_${metadata}`] = customMetadata[metadata];
        }

        const baseHttpEndpoint = baseEndpointUrl.replace(/\/+$/, '');

        const container = new Container({
            ...containerConfiguration,
            evaluationBaseEndpointUrl: baseHttpEndpoint,
            contentBaseEndpointUrl: baseHttpEndpoint,
            trackerEndpointUrl: `${baseHttpEndpoint}/client/web/track`,
            cidAssignerEndpointUrl: cidAssignerEndpointUrl ?? `${baseHttpEndpoint}/client/web/cid`,
            beaconQueueSize: containerConfiguration.beaconQueueSize ?? 100,
            eventMetadata: eventMetadata,
        });

        const logger = container.getLogger();
        const {appId, tokenScope} = container.getConfiguration();

        logger.debug(
            '\n\n'
            + ' ██████ ██████   ██████   ██████ ████████ \n'
            + '██      ██   ██ ██    ██ ██         ██    \n'
            + '██      ██████  ██    ██ ██         ██    \n'
            + '██      ██   ██ ██    ██ ██         ██    \n'
            + ' ██████ ██   ██  ██████   ██████    ██    \n'
            + '\n',
        );

        logger.info(`Initializing SDK v${VERSION}...`);
        logger.debug(`App ID: ${appId}`);

        const context = container.getContext();
        const tab = context.getTab();
        const user = context.getUser();

        logger.debug(`${tab.isNew ? 'New' : 'Current'} tab: ${tab.id}`);
        logger.debug(`Token scope: ${tokenScope}`);
        logger.debug(`Current user: ${user !== null ? user : 'anonymous'}`);
        logger.debug(`Test mode: ${containerConfiguration.test}`);
        logger.info('⚡ Croct SDK is ready!');

        return new Sdk(container);
    }

    public get appId(): string {
        const {appId} = this.container.getConfiguration();

        return appId;
    }

    public get cidAssigner(): CidAssigner {
        return this.container.getCidAssigner();
    }

    public get previewTokenStore(): TokenStore {
        return this.container.getPreviewTokenStore();
    }

    public get userTokenStore(): TokenStore {
        return this.container.getUserTokenStore();
    }

    public get context(): Context {
        return this.container.getContext();
    }

    public get tracker(): Tracker {
        return this.container.getTracker();
    }

    public get evaluator(): Evaluator {
        return this.container.getEvaluator();
    }

    public get contentFetcher(): ContentFetcher {
        return this.container.getContentFetcher();
    }

    public get eventManager(): EventManager<SdkEventMap> {
        return this.container.getEventManager();
    }

    public getLogger(...namespace: string[]): Logger {
        return this.container.getLogger(...namespace);
    }

    public getTabStorage(namespace: string, ...subnamespace: string[]): Storage {
        return this.container.getTabStorage(namespace, ...subnamespace);
    }

    public getBrowserStorage(namespace: string, ...subnamespace: string[]): Storage {
        return this.container.getBrowserStorage(namespace, ...subnamespace);
    }

    public async close(): Promise<void> {
        if (this.closed) {
            return;
        }

        const logger = this.getLogger();

        logger.debug('Closing SDK...');
        this.closed = true;
        await this.container.dispose();

        logger.info('SDK closed.');
    }
}
