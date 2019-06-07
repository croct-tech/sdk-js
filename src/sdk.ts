import Tracker from './tracker';
import {ConsoleLogger, Logger, NullLogger, PrefixedLogger} from './logging';
import {TokenScope} from './token';
import {BeaconTransport, WebSocketTransport} from "./transport";
import {Context} from "./context";
import {NamespacedStorage} from "./storage";
import {PayloadType} from "./beacon";
import {BackoffPolicy} from "./retry";
import {WebStorageQueue} from "./queue";

type Config = {
    readonly apiKey: string;
    readonly storageNamespace: string;
    readonly tokenScope: TokenScope;
    readonly debug: boolean;
}

export default class Sdk {
    private static singleton: Sdk;

    private readonly config: Config;
    private tracker: Tracker;
    private context: Context;
    private logger: Logger;
    private transport: BeaconTransport;

    private constructor(config: Config) {
        this.config = config;

        this.initialize();
    }

    private static get instance() : Sdk {
        if (Sdk.singleton === undefined) {
            throw new Error('Croct SDK is not installed');
        }

        return Sdk.singleton;
    }

    static install(config: Config) : void {
        if (Sdk.singleton) {
            throw new Error('The SDK is already installed');
        }

        Sdk.singleton = new Sdk({
            storageNamespace: 'croct',
            tokenScope: TokenScope.GLOBAL,
            debug: false,
            ...config
        });
    }

    static uninstall() : void {
        if (!Sdk.singleton) {
            return;
        }

        Sdk.singleton.destroy();

        delete Sdk.singleton;
    }

    static get tracker() : Tracker {
        return Sdk.instance.getTracker();
    }

    private initialize() : void {
        const logger = this.getLogger();

        logger.info('Croct SDK installed');

        const context = this.getContext();
        const tab = context.getCurrentTab();

        logger.info('Context initialized');
        logger.log(`Token scope: ${this.config.tokenScope}`);
        logger.log(`${tab.isNew() ? 'New' : 'Current'} tab: ${tab.getId()}`);
    }

    private destroy() : void {
        if (this.context) {
            this.context.dispose();
        }

        if (this.tracker) {
            this.tracker.disable();
        }

        if (this.transport) {
            this.transport.close();
        }

        const logger = this.getLogger();

        logger.info('Croct SDK uninstalled');
    }

    private getTracker(): Tracker {
        if (this.tracker === undefined) {
            this.tracker = this.createTracker();
        }

        return this.tracker;
    }

    private createTracker() : Tracker {
        const context = this.getContext();
        const tab = context.getCurrentTab();

        return new Tracker(
            this.getContext(),
            this.getTransport(),
            new WebStorageQueue(
                this.getTabStorage('queue'),
                tab.getId(),
            ),
            50,
            0.5,
            this.getLogger('Tracker')
        );
    }

    private getContext() : Context {
        if (this.context === undefined) {
            this.context = this.createContext();
        }

        return this.context;
    }

    private createContext() : Context {
        return Context.initialize(
            this.getTabStorage('context'),
            this.getGlobalStorage('context'),
            this.config.tokenScope
        )
    }

    private getLogger(prefix?: string) : Logger {
        if (this.logger === undefined) {
            this.logger = this.createLogger();
        }

        if (prefix) {
            return new PrefixedLogger(this.logger, prefix);
        }

        return this.logger;
    }

    private createLogger() : Logger {
        return this.config.debug ? new ConsoleLogger() : new NullLogger();
    }

    private getTransport() : BeaconTransport {
        if (this.transport === undefined) {
            this.transport = this.createTransport();
        }

        return this.transport;
    }

    private createTransport() : BeaconTransport {
        return new WebSocketTransport(
            'wss://croct.local:8443/track/' + this.config.apiKey,
            [],
            new BackoffPolicy(),
            2000,
            this.getLogger('Transporter')
        )
    }

    private getTabStorage(namespace: string ) : Storage {
        return new NamespacedStorage(
            sessionStorage,
            this.resolveStorageNamespace(namespace)
        );
    }

    private getGlobalStorage(namespace: string) : Storage {
        return new NamespacedStorage(
            localStorage,
            this.resolveStorageNamespace(namespace)
        );
    }

    private resolveStorageNamespace(namespace: string) : string {
        let prefix = this.config.storageNamespace;

        if (prefix !== '') {
            prefix += '.'
        }

        return prefix + namespace;
    }
}

