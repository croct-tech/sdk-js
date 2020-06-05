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
import {ExternalEvent, ExternalEventPayload, ExternalEventType} from '../event';

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
            sdk.setToken(token);
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
            this.userFacade = new UserFacade(this.sdk.tracker);
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
        if (typeof userId !== 'string') {
            throw new Error('The user ID must be of type string.');
        }

        this.sdk.tracker.setToken(Token.issue(this.sdk.appId, userId));
    }

    public anonymize(): void {
        if (!this.sdk.tracker.isUserAnonymous()) {
            this.sdk.tracker.unsetToken();
        }
    }

    public setToken(token: string): void {
        if (typeof token !== 'string') {
            throw new Error('The token must be of type string.');
        }

        this.sdk.tracker.setToken(Token.parse(token));
    }

    public unsetToken(): void {
        this.sdk.tracker.unsetToken();
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
