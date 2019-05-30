import Tracker from './tracker';
import {ConsoleLogger, Logger, NullLogger} from './logging';
import {TokenScope} from './token';

const enum SdkError {
    NOT_INSTALLED = 'Croct SDK is not installed, see http://croct.com/getting-started.',
    ALREADY_INSTALLED = 'The SDK is already configured.',
    INVALID_CONFIGURATION = 'The configuration must a key-value map.',
    INVALID_API_KEY = 'The API key must be a non-empty string.',
    INVALID_STORAGE_NAMESPACE = 'The option "storageNamespace" must be a non-empty string.',
    INVALID_TOKEN_SCOPE = 'The option "tokenScope" is invalid.',
    INVALID_DEBUG_FLAG = 'The option "debug" must be true or false.',
}

interface Config {
    readonly apiKey: string;
    readonly storageNamespace: string;
    readonly tokenScope: TokenScope;
    readonly debug: boolean;
}

export class SDK {
    private static instance: SDK;
    private readonly config: Config;
    private tracker: Tracker;
    private logger: Logger;

    private constructor(settings: Config) {
        this.config = settings;
    }

    static install(config: any) {
        if (SDK.instance) {
            throw new Error(SdkError.ALREADY_INSTALLED);
        }

        SDK.instance = SDK.configure(config);

        const logger = SDK.instance.getLogger();
        logger.info('Croct SDK installed');
    }

    static uninstall() {
        if (!SDK.instance) {
            return;
        }

        const logger = SDK.instance.getLogger();
        logger.info('Croct SDK uninstalled');

        SDK.instance.dispose();

        delete SDK.instance;
    }

    private static configure(config: any) : SDK {
        if (typeof config !== 'object') {
            throw new Error(SdkError.INVALID_CONFIGURATION)
        }

        config = {
            storageNamespace: 'croct',
            tokenScope: TokenScope.GLOBAL,
            debug: false,
            ...config,
        };

        if (typeof config.apiKey !== 'string' || !config.apiKey) {
            throw new Error(SdkError.INVALID_API_KEY);
        }

        if (typeof config.storageNamespace !== 'string') {
            throw new Error(SdkError.INVALID_STORAGE_NAMESPACE);
        }

        if (!Object.values(TokenScope).includes(config.tokenScope)) {
            throw new Error(SdkError.INVALID_TOKEN_SCOPE);
        }

        if (![true, false].includes(config.debug)) {
            throw new Error(SdkError.INVALID_DEBUG_FLAG);
        }

        return new SDK(config);
    }

    static get singleton() : SDK {
        if (SDK.instance === undefined) {
            throw new Error(SdkError.NOT_INSTALLED);
        }

        return SDK.instance;
    }

    getTracker(): Tracker {
        if (this.tracker === undefined) {
            this.tracker = this.createTracker();
        }

        return this.tracker;
    }

    private createTracker() : Tracker {
        return Tracker.initialize({
            tokenScope: this.config.tokenScope,
            storageNamespace: this.config.storageNamespace,
            logger: this.logger,
        })
    }

    private getLogger() : Logger {
        if (this.logger === undefined) {
            this.logger = this.createLogger();
        }

        return this.logger;
    }

    private createLogger() : Logger {
        return this.config.debug ? new ConsoleLogger() : new NullLogger();
    }

    dispose() : void {
        if (this.tracker) {
            this.tracker.shutdown();
        }
    }
}