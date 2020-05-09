import Token, {TokenStorage} from './token';
import Tab from './tab';
import PersistentStorage from './tokenStorage/persistentStorage';
import ReplicatedStorage from './tokenStorage/replicatedStorage';
import InMemoryStorage from './tokenStorage/inMemoryStorage';
import {uuid4} from './uuid';

export type TokenScope = 'isolated' | 'global' | 'contextual';

export default class Context {
    private readonly tab: Tab;

    private readonly tokenStorage: TokenStorage;

    public constructor(tab: Tab, tokenStorage: TokenStorage) {
        this.tab = tab;
        this.tokenStorage = tokenStorage;
    }

    public static load(sessionStorage: Storage, applicationStorage: Storage, tokenScope: TokenScope): Context {
        let tabId: string | null = sessionStorage.getItem('tab');
        let newTab = false;

        if (tabId === null) {
            tabId = uuid4(true);
            newTab = true;
        }

        const tab = new Tab(tabId, newTab);

        sessionStorage.removeItem('tab');

        tab.addListener('unload', () => sessionStorage.setItem('tab', tab.id));

        switch (tokenScope) {
            case 'isolated':
                return new Context(tab, new InMemoryStorage());

            case 'global':
                return new Context(tab, new PersistentStorage(applicationStorage));

            case 'contextual': {
                const primaryStorage = new PersistentStorage(sessionStorage, `${tabId}.token`);
                const secondaryStorage = new PersistentStorage(applicationStorage);

                if (tab.isNew) {
                    primaryStorage.setToken(secondaryStorage.getToken());
                }

                tab.addListener('visibilityChange', event => {
                    if (event.detail.visible) {
                        secondaryStorage.setToken(primaryStorage.getToken());
                    }
                });

                return new Context(tab, new ReplicatedStorage(primaryStorage, secondaryStorage));
            }
        }
    }

    public getTab(): Tab {
        return this.tab;
    }

    public isAnonymous(): boolean {
        const token = this.getToken();

        return token == null || token.isAnonymous();
    }

    public getUser(): string | null {
        const token = this.getToken();

        return token == null ? null : token.getSubject();
    }

    public getToken(): Token | null {
        return this.tokenStorage.getToken();
    }

    public setToken(token: Token | null): void {
        this.tokenStorage.setToken(token);
    }
}
