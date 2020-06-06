import EvaluatorFacade, {EvaluationOptions, TabContextFactory} from './evaluatorFacade';
import TrackerFacade from './trackerFacade';
import Context, {TokenScope} from '../context';
import UserFacade from './userFacade';
import Token from '../token';
import {JsonValue} from '../json';
import {formatCause} from '../error';
import {configurationSchema} from '../schema/sdkFacadeSchemas';
import Sdk from '../sdk';
import SessionFacade from './sessionFacade';
import {Logger} from '../logging';
import {ExternalEvent, ExternalEventPayload, ExternalEventType, PartialEvent} from '../event';

export type Configuration = {
    appId: string,
    tokenScope?: TokenScope,
    debug?: boolean,
    track?: boolean,
    token?: string,
    userId?: string,
    eventMetadata?: {[key: string]: string},
    logger?: Logger,
    trackerEndpointUrl?: string,
    evaluationEndpointUrl?: string,
    bootstrapEndpointUrl?: string,
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

export default class SdkFacade {
    private readonly sdk: Sdk;

    private trackerFacade?: TrackerFacade;

    private userFacade?: UserFacade;

    private sessionFacade?: SessionFacade;

    private evaluatorFacade?: EvaluatorFacade;

    private constructor(sdk: Sdk) {
        this.sdk = sdk;
    }

    public static init(configuration: Configuration): SdkFacade {
        validateConfiguration(configuration);

        const {track = true, userId, token, ...containerConfiguration} = configuration;

        if (userId !== undefined && token !== undefined) {
            throw new Error('Either the user ID or token can be specified, but not both.');
        }

        const sdk = new SdkFacade(
            Sdk.init({
                ...containerConfiguration,
                tokenScope: containerConfiguration.tokenScope ?? 'global',
                debug: containerConfiguration.debug ?? false,
            }),
        );

        if (userId !== undefined) {
            sdk.identify(userId);
        } else if (token !== undefined) {
            sdk.setToken(Token.parse(token));
        }

        if (track) {
            sdk.tracker.enable();
        }

        return sdk;
    }

    public get context(): Context {
        return this.sdk.context;
    }

    public getCid(): Promise<string> {
        return this.sdk.getCid();
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
            this.evaluatorFacade = new EvaluatorFacade(
                this.sdk.evaluator,
                new TabContextFactory(this.sdk.context.getTab()),
            );
        }

        return this.evaluatorFacade;
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

    private trackInternalEvent(event: PartialEvent): void {
        this.sdk.tracker.track(event).catch(() => {
            // suppress error as it is already logged by the tracker
        });
    }

    public track<T extends ExternalEventType>(type: T, payload: ExternalEventPayload<T>): Promise<ExternalEvent<T>> {
        return this.tracker.track(type, payload);
    }

    public evaluate(expression: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        return this.evaluator.evaluate(expression, options);
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
