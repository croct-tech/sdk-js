import {InMemoryTokenStorage, ReplicatedTokenStorage, Token, TokenScope, TokenStorage, WebTokenStorage} from "./token";
import {Tab} from "./tab";
import {Logger, NullLogger} from "./logging";

export class Context {
    private readonly tab: Tab;
    private readonly tokenStorage: TokenStorage;

    constructor(tab: Tab, tokenStorage: TokenStorage) {
        this.tab = tab;
        this.tokenStorage = tokenStorage;
    }

    static initialize(tabStorage : Storage, globalStorage: Storage, tokenScope: TokenScope) {
        const tabId : string | null = tabStorage.getItem('tab');
        const tab = new Tab(tabId || Date.now() + '', tabId === null);

        tabStorage.removeItem('tab');

        tab.onUnload(() => {
            tabStorage.setItem('tab', tab.getId())
        });

        const tokenStorages: {[key in TokenScope]: {(): TokenStorage}} = {
            [TokenScope.ISOLATED]: () => {
                return new InMemoryTokenStorage();
            },
            [TokenScope.GLOBAL]: () => {
                return new WebTokenStorage(globalStorage);
            },
            [TokenScope.CONTEXTUAL]: () => {
                const primaryStorage = new WebTokenStorage(tabStorage);
                const secondaryStorage = new WebTokenStorage(globalStorage);

                if (tab.isNew()) {
                    primaryStorage.setToken(secondaryStorage.getToken())
                }

                tab.onVisible(() => {
                    secondaryStorage.setToken(primaryStorage.getToken());
                });

                return new ReplicatedTokenStorage(primaryStorage, secondaryStorage);
            }
        };

        return new Context(tab, tokenStorages[tokenScope]())
    }

    getCurrentTab() : Tab {
        return this.tab;
    }

    getToken() : Token | null {
        return this.tokenStorage.getToken();
    }

    setToken(token: Token | null) : void {
        this.tokenStorage.setToken(token);
    }

    dispose() {
        this.tab.sleep();
    }
}