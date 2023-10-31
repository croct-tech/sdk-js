import {EvaluatorFacade, TabContextFactory} from './evaluatorFacade';
import {TrackerFacade} from './trackerFacade';
import {Context, TokenScope} from '../context';
import {UserFacade} from './userFacade';
import {Token, TokenStore} from '../token';
import {formatCause} from '../error';
import {sdkFacadeConfigurationSchema} from '../schema';
import {Sdk} from '../sdk';
import {SessionFacade} from './sessionFacade';
import {Logger} from '../logging';
import {SdkEventMap} from '../sdkEvents';
import {EventManager} from '../eventManager';
import {CidAssigner} from '../cid';
import {PartialTrackingEvent} from '../trackingEvents';
import {UrlSanitizer} from '../tab';
import {ContentFetcherFacade} from './contentFetcherFacade';

type Options = {
    preferredLocale?: string,
};

export type Configuration = Options & {
    appId: string,
    tokenScope?: TokenScope,
    debug?: boolean,
    test?: boolean,
    track?: boolean,
    token?: string | null,
    userId?: string | null,
    clientId?: string,
    eventMetadata?: {[key: string]: string},
    logger?: Logger,
    urlSanitizer?: UrlSanitizer,
    baseEndpointUrl?: string,
    disableCidMirroring?: boolean,
    cidAssignerEndpointUrl?: string,
};

function validateConfiguration(configuration: unknown): asserts configuration is Configuration {
    try {
        sdkFacadeConfigurationSchema.validate(configuration);
    } catch (violation) {
        throw new Error(`Invalid configuration: ${formatCause(violation)}`);
    }
}

export class SdkFacade {
    private readonly sdk: Sdk;

    private trackerFacade?: TrackerFacade;

    private userFacade?: UserFacade;

    private sessionFacade?: SessionFacade;

    private evaluatorFacade?: EvaluatorFacade;

    private contentFetcherFacade?: ContentFetcherFacade;

    private readonly options: Options;

    private constructor(sdk: Sdk, options: Options = {}) {
        this.sdk = sdk;
        this.options = options;
    }

    public static init(configuration: Configuration): SdkFacade {
        validateConfiguration(configuration);

        const {track = true, userId, token, preferredLocale, ...containerConfiguration} = configuration;

        if (userId !== undefined && token !== undefined) {
            throw new Error('Either the user ID or token can be specified, but not both.');
        }

        const sdk = new SdkFacade(
            Sdk.init({
                ...containerConfiguration,
                tokenScope: containerConfiguration.tokenScope ?? 'global',
                debug: containerConfiguration.debug ?? false,
                test: containerConfiguration.test ?? false,
                disableCidMirroring: containerConfiguration.disableCidMirroring ?? false,
            }),
            {
                preferredLocale: preferredLocale,
            },
        );

        if (userId !== undefined) {
            if (userId === null) {
                sdk.unsetToken();
            } else {
                const currentToken = sdk.context.getToken();

                if (currentToken?.getSubject() !== userId) {
                    sdk.identify(userId);
                }
            }
        } else if (token !== undefined) {
            if (token === null) {
                sdk.unsetToken();
            } else {
                sdk.setToken(Token.parse(token));
            }
        }

        if (track) {
            sdk.tracker.enable();
        }

        return sdk;
    }

    public get context(): Context {
        return this.sdk.context;
    }

    public get cidAssigner(): CidAssigner {
        return this.sdk.cidAssigner;
    }

    public get previewTokenStore(): TokenStore {
        return this.sdk.previewTokenStore;
    }

    public get userTokenStore(): TokenStore {
        return this.sdk.userTokenStore;
    }

    public get tracker(): TrackerFacade {
        if (this.trackerFacade === undefined) {
            this.trackerFacade = new TrackerFacade(this.sdk.tracker);
        }

        return this.trackerFacade;
    }

    public get user(): UserFacade {
        if (this.userFacade === undefined) {
            this.userFacade = new UserFacade(this.context, this.sdk.tracker);
        }

        return this.userFacade;
    }

    public get session(): SessionFacade {
        if (this.sessionFacade === undefined) {
            this.sessionFacade = new SessionFacade(this.sdk.tracker);
        }

        return this.sessionFacade;
    }

    public get evaluator(): EvaluatorFacade {
        if (this.evaluatorFacade === undefined) {
            this.evaluatorFacade = new EvaluatorFacade({
                evaluator: this.sdk.evaluator,
                contextFactory: new TabContextFactory(this.sdk
                    .context
                    .getTab()),
                cidAssigner: this.sdk.cidAssigner,
                userTokenProvider: this.sdk.userTokenStore,
            });
        }

        return this.evaluatorFacade;
    }

    public get contentFetcher(): ContentFetcherFacade {
        if (this.contentFetcherFacade === undefined) {
            this.contentFetcherFacade = new ContentFetcherFacade({
                contentFetcher: this.sdk.contentFetcher,
                contextFactory: new TabContextFactory(this.sdk
                    .context
                    .getTab()),
                cidAssigner: this.sdk.cidAssigner,
                previewTokenProvider: this.sdk.previewTokenStore,
                userTokenProvider: this.sdk.userTokenStore,
                preferredLocale: this.options.preferredLocale,
            });
        }

        return this.contentFetcherFacade;
    }

    public get eventManager(): EventManager<Record<string, Record<string, unknown>>, SdkEventMap> {
        const {eventManager} = this.sdk;

        return {
            addListener: eventManager.addListener.bind(eventManager),
            removeListener: eventManager.removeListener.bind(eventManager),
            dispatch: (eventName: string, event: Record<string, unknown>): void => {
                if (!/[a-z][a-z_]+\.[a-z][a-z_]+/i.test(eventName)) {
                    throw new Error(
                        'The event name must be in the form of "namespaced.eventName", where '
                        + 'both the namespace and event name must start with a letter, followed by '
                        + 'any series of letters and underscores.',
                    );
                }

                eventManager.dispatch(eventName, event);
            },
        };
    }

    public identify(userId: string): void {
        this.setToken(Token.issue(this.sdk.appId, userId));
    }

    public anonymize(): void {
        if (!this.context.isAnonymous()) {
            this.unsetToken();
        }
    }

    public getToken(): Token|null {
        return this.context.getToken();
    }

    public setToken(token: Token): void {
        const currentToken = this.getToken();

        if (currentToken !== null && currentToken.toString() === token.toString()) {
            return;
        }

        const currentSubject = currentToken?.getSubject() ?? null;
        const subject = token.getSubject();
        const logger = this.getLogger();

        if (subject === currentSubject) {
            this.context.setToken(token);

            logger.debug('Token refreshed');

            return;
        }

        if (currentSubject !== null) {
            this.trackInternalEvent({
                type: 'userSignedOut',
                userId: currentSubject,
            });

            logger.info('User signed out');
        }

        this.context.setToken(token);

        if (subject !== null) {
            this.trackInternalEvent({
                type: 'userSignedIn',
                userId: subject,
            });

            logger.info(`User signed in as ${subject}`);
        }

        logger.debug('New token saved, ');
    }

    public unsetToken(): void {
        const token = this.getToken();

        if (token === null) {
            return;
        }

        const logger = this.getLogger();
        const subject = token.getSubject();

        if (subject !== null) {
            this.trackInternalEvent({
                type: 'userSignedOut',
                userId: subject,
            });

            logger.info('User signed out');
        }

        this.context.setToken(null);

        logger.debug('Token removed');
    }

    private trackInternalEvent(event: PartialTrackingEvent): void {
        this.sdk
            .tracker
            .track(event)
            .catch(() => {
                // suppress error as it is already logged by the tracker
            });
    }

    public getLogger(...namespace: string[]): Logger {
        return this.sdk.getLogger(...namespace);
    }

    public getTabStorage(namespace: string, ...subnamespace: string[]): Storage {
        return this.sdk.getTabStorage(namespace, ...subnamespace);
    }

    public getBrowserStorage(namespace: string, ...subnamespace: string[]): Storage {
        return this.sdk.getBrowserStorage(namespace, ...subnamespace);
    }

    public close(): Promise<void> {
        return this.sdk.close();
    }
}
