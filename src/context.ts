import {Token, TokenStorage} from './token';
import {Tab} from './tab';
import {PersistentStorage} from './tokenStorage/persistentStorage';
import {ReplicatedStorage} from './tokenStorage/replicatedStorage';
import {InMemoryStorage} from './tokenStorage/inMemoryStorage';

function uuid() {
    let uuid = '';

    for (let i = 0; i < 32; i++) {
        const random = Math.random() * 16 | 0;

        if (i == 8 || i == 12 || i == 16 || i == 20) {
            uuid += '-';
        }

        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return uuid;
}

export type TokenScope = 'isolated' | 'global' | 'contextual';

export class Context {
    private readonly tab: Tab;
    private readonly tokenStorage: TokenStorage;

    constructor(tab: Tab, tokenStorage: TokenStorage) {
        this.tab = tab;
        this.tokenStorage = tokenStorage;
    }

    static initialize(tabStorage: Storage, globalStorage: Storage, tokenScope: TokenScope) {
        const tabId: string | null = tabStorage.getItem('tab');
        const tab = new Tab(tabId || uuid(), tabId === null);

        tabStorage.removeItem('tab');

        tab.addListener('unload', () => tabStorage.setItem('tab', tab.id));

        const tokenStorages: { [key in TokenScope]: { (): TokenStorage } } = {
            isolated: () => {
                return new InMemoryStorage();
            },
            global: () => {
                return new PersistentStorage(globalStorage);
            },
            contextual: () => {
                const primaryStorage = new PersistentStorage(tabStorage);
                const secondaryStorage = new PersistentStorage(globalStorage);

                if (tab.isNew) {
                    primaryStorage.setToken(secondaryStorage.getToken());
                }

                tab.addListener('visibility', event => {
                    if (event.detail.isVisible) {
                        secondaryStorage.setToken(primaryStorage.getToken());
                    }
                });

                return new ReplicatedStorage(primaryStorage, secondaryStorage);
            },
        };

        return new Context(tab, tokenStorages[tokenScope]());
    }

    getTab(): Tab {
        return this.tab;
    }

    getToken(): Token | null {
        return this.tokenStorage.getToken();
    }

    setToken(token: Token | null): void {
        this.tokenStorage.setToken(token);
    }
}