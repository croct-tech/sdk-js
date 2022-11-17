import {Token, TokenStore, CachedTokenStore, ReplicatedTokenStore, InMemoryTokenStore} from './token';
import {Tab, UrlSanitizer} from './tab';
import {uuid4} from './uuid';
import {EventDispatcher} from './eventManager';
import {SdkEventMap} from './sdkEvents';
import {LocalStorageCache} from './cache';

export type TokenScope = 'isolated' | 'global' | 'contextual';

export type Configuration = {
    tokenScope: TokenScope,
    urlSanitizer?: UrlSanitizer,
    eventDispatcher: ContextEventDispatcher,
    cache: {
        tabId: LocalStorageCache,
        tabToken: LocalStorageCache,
        browserToken: LocalStorageCache,
    },
};

type ContextEventDispatcher = EventDispatcher<Pick<SdkEventMap, 'tokenChanged'>>;

function tokenEquals(left: Token|null, right: Token|null): boolean {
    return left === right || (left !== null && right !== null && left.toString() === right.toString());
}

export class Context {
    private readonly tab: Tab;

    private readonly tokenStore: TokenStore;

    private readonly eventDispatcher: ContextEventDispatcher;

    private lastToken: Token|null;

    private constructor(tab: Tab, tokenStore: TokenStore, eventDispatcher: ContextEventDispatcher) {
        this.tab = tab;
        this.tokenStore = tokenStore;
        this.eventDispatcher = eventDispatcher;
        this.lastToken = tokenStore.getToken();
        this.syncToken = this.syncToken.bind(this);
    }

    public static load({cache, tokenScope, eventDispatcher, urlSanitizer}: Configuration): Context {
        let tabId: string | null = cache.tabId.get();
        let newTab = false;

        if (tabId === null) {
            tabId = uuid4(true);
            newTab = true;
        }

        const tab = new Tab(tabId, newTab, urlSanitizer);

        cache.tabId.clear();

        tab.addListener('unload', () => cache.tabId.put(tab.id));

        switch (tokenScope) {
            case 'isolated':
                return new Context(tab, new InMemoryTokenStore(), eventDispatcher);

            case 'global': {
                const context = new Context(tab, new CachedTokenStore(cache.browserToken), eventDispatcher);

                cache.browserToken.addListener(context.syncToken);

                return context;
            }

            case 'contextual': {
                const primaryStorage = new CachedTokenStore(cache.tabToken);
                const secondaryStorage = new CachedTokenStore(cache.browserToken);

                if (tab.isNew) {
                    primaryStorage.setToken(secondaryStorage.getToken());
                }

                tab.addListener('visibilityChange', event => {
                    if (event.detail.visible) {
                        secondaryStorage.setToken(primaryStorage.getToken());
                    }
                });

                return new Context(tab, new ReplicatedTokenStore(primaryStorage, secondaryStorage), eventDispatcher);
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
        return this.tokenStore.getToken();
    }

    public setToken(token: Token | null): void {
        const oldToken = this.lastToken;

        this.lastToken = token;
        this.tokenStore.setToken(token);

        if (!tokenEquals(oldToken, token)) {
            this.eventDispatcher.dispatch('tokenChanged', {
                oldToken: oldToken,
                newToken: token,
            });
        }
    }

    private syncToken(): void {
        const newToken = this.tokenStore.getToken();
        const oldToken = this.lastToken;

        if (!tokenEquals(oldToken, newToken)) {
            this.lastToken = newToken;

            this.eventDispatcher.dispatch('tokenChanged', {
                oldToken: oldToken,
                newToken: newToken,
            });
        }
    }
}
