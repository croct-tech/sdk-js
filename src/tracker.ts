import {record, mirror} from "rrweb";
import {EventType, eventWithTime} from 'rrweb/typings/types';
import {Logger, NullLogger} from "./logging";
import {Tab} from "./tab";
import {
    InMemoryTokenStorage,
    ReplicatedTokenStorage,
    Token,
    TokenScope,
    TokenStorage,
    WebTokenStorage
} from "./token";

interface Options {
    tokenScope?: TokenScope,
    storageNamespace?: string,
    logger?: Logger,
}

class Tracker {
    private logger: Logger;
    private readonly tab: Tab;
    private readonly tokenStorage: TokenStorage;

    constructor(tab: Tab, tokenStorage: TokenStorage, logger: Logger) {
        this.tab = tab;
        this.tokenStorage = tokenStorage;
        this.logger = logger;
    }

    static initialize(options: Options) {
        const {
            storageNamespace = '',
            tokenScope = TokenScope.GLOBAL,
            logger = new NullLogger()
        } = options;

        const prefix = storageNamespace + (storageNamespace ? '.' : '');
        const tabKey = prefix + 'tab';
        const tokenKey = prefix + 'token';

        const tabId : string | null = sessionStorage.getItem(tabKey);
        const tab = new Tab(tabId || Date.now() + '', tabId === null);

        sessionStorage.removeItem(tabKey);

        tab.onUnload(() => {
            sessionStorage.setItem(tabKey, tab.getId())
        });

        const tokenStorages: {[key in TokenScope]: {(): TokenStorage}} = {
            [TokenScope.ISOLATED]: () => {
                return new InMemoryTokenStorage();
            },
            [TokenScope.GLOBAL]: () => {
                return new WebTokenStorage(localStorage, tokenKey);
            },
            [TokenScope.CONTEXTUAL]: () => {
                const primaryStorage = new WebTokenStorage(sessionStorage, tokenKey);
                const secondaryStorage = new WebTokenStorage(localStorage, tokenKey);

                if (tab.isNew()) {
                    primaryStorage.setToken(secondaryStorage.getToken())
                }

                tab.onVisible(() => {
                    secondaryStorage.setToken(primaryStorage.getToken());
                });

                return new ReplicatedTokenStorage(primaryStorage, secondaryStorage);
            }
        };

        logger.log('Tracker initialized');
        logger.log(`Token scope: ${tokenScope}`);
        logger.log(`${tab.isNew() ? 'New' : 'Current'} tab: ${tab.getId()}`);

        return new Tracker(tab, tokenStorages[tokenScope](), logger)
    }

    start() {
        this.logger.log('Tracking started');

        this.tab.wakeup()
    }

    stop() {
        this.logger.log('Tracking stopped');
    }

    shutdown() {
        this.stop();
        this.tab.sleep();
    }

    identify(user: string | null) {
        this.tokenStorage.setToken(user == null ? null : new Token(user, Date.now()));
    }

    anonymize() {
        this.tokenStorage.setToken(null);
    }

    getToken() : Token | null {
        return this.tokenStorage.getToken();
    }

    private emit(event: eventWithTime) : void {
        console.log(this.createBeacon(event));
    }

    private createBeacon(event: eventWithTime) : object | null {
        const payload = this.createPayload(event);

        if (payload === null) {
            return null;
        }

        return {
            userToken: null,
            timestamp: event.timestamp,
            payload: {
                ...this.createPayload(event)
            }
        };
    }

    private createPayload(event: eventWithTime) : object | null {
        switch (event.type) {
            //case EventType.DomContentLoaded:
            case 0:
                break;
            //case EventType.Load:
            case 1:
                break;
            //case EventType.FullSnapshot:
            case 2:
                break;
            //case EventType.IncrementalSnapshot:
            case 3:
                break;

            //case EventType.Meta:
            case 4:
                break;

        }


        return null;
    }
}

export default Tracker;