import {Container} from './container';
import Context, {TokenScope} from './context';
import {Logger} from './logging';
import {BOOTSTRAP_ENDPOINT_URL, EVALUATION_ENDPOINT_URL, TRACKER_ENDPOINT_URL, VERSION} from './constants';
import {configurationSchema} from './schema/sdkSchemas';
import {formatCause} from './error';
import Tracker from './tracker';
import Evaluator from './evaluator';
import {SdkEventMap} from './sdkEvents';
import {EventManager} from './eventManager';
import CidAssigner from './cid/index';
import {UrlSanitizer} from './tab';

export type Configuration = {
    appId: string,
    tokenScope: TokenScope,
    debug: boolean,
    cid?: string,
    trackerEndpointUrl?: string,
    evaluationEndpointUrl?: string,
    bootstrapEndpointUrl?: string,
    beaconQueueSize?: number,
    urlSanitizer?: UrlSanitizer,
    logger?: Logger,
    eventMetadata?: {[key: string]: string},
};

function validateConfiguration(configuration: unknown): asserts configuration is Configuration {
    if (typeof configuration !== 'object' || configuration === null) {
        throw new Error('The configuration must be a key-value map.');
    }

    try {
        configurationSchema.validate(configuration);
    } catch (violation) {
        throw new Error(`Invalid configuration: ${formatCause(violation)}`);
    }
}

export default class Sdk {
    private container: Container;

    private closed: boolean;

    private constructor(container: Container) {
        this.container = container;
    }

    public static init(configuration: Configuration): Sdk {
        validateConfiguration(configuration);

        const {eventMetadata: customMetadata = {}, ...containerConfiguration} = configuration;

        const eventMetadata: {[key: string]: string} = {
            sdkVersion: VERSION,
        };

        for (const metadata of Object.keys(customMetadata)) {
            eventMetadata[`custom_${metadata}`] = customMetadata[metadata];
        }

        const container = new Container({
            ...containerConfiguration,
            evaluationEndpointUrl: containerConfiguration.evaluationEndpointUrl ?? EVALUATION_ENDPOINT_URL,
            trackerEndpointUrl: containerConfiguration.trackerEndpointUrl ?? TRACKER_ENDPOINT_URL,
            bootstrapEndpointUrl: containerConfiguration.bootstrapEndpointUrl ?? BOOTSTRAP_ENDPOINT_URL,
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

    public get context(): Context {
        return this.container.getContext();
    }

    public get tracker(): Tracker {
        return this.container.getTracker();
    }

    public get evaluator(): Evaluator {
        return this.container.getEvaluator();
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
