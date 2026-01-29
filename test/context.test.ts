import type {TokenScope} from '../src/context';
import {Context} from '../src/context';
import {Token} from '../src/token';
import {TabEventEmulator} from './utils/tabEventEmulator';
import {LocalStorageCache} from '../src/cache';
import {DumbStorage} from './utils/dumbStorage';
import type {EventDispatcher} from '../src/eventManager';
import type {SdkEventMap} from '../src/sdkEvents';

describe('A context', () => {
    const tabEventEmulator: TabEventEmulator = new TabEventEmulator();
    const appId = '1ec38bc1-8512-4c59-a011-7cc169bf9939';
    const carolToken = Token.issue(appId, 'c4r0l');
    const erickToken = Token.issue(appId, '3r1ck');

    beforeEach(() => {
        tabEventEmulator.registerListeners();
        localStorage.clear();
    });

    afterEach(() => {
        tabEventEmulator.reset();
    });

    it('should have a tab', () => {
        const tabStorage = new DumbStorage();

        const context = Context.load({
            tokenScope: 'global',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(tabStorage, 'tab'),
                tabToken: new LocalStorageCache(tabStorage, 'token'),
                browserToken: new LocalStorageCache(localStorage, 'token'),
            },
        });

        const tab = context.getTab();

        expect(tab.id).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/);
        expect(tab.isNew).toEqual(true);
    });

    it('should share token across all tabs if the token scope is global', () => {
        const browserCache = new LocalStorageCache(localStorage, 'token');

        const aTabStorage = new DumbStorage();

        const contextA = Context.load({
            tokenScope: 'global',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(aTabStorage, 'tab'),
                tabToken: new LocalStorageCache(aTabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        contextA.setToken(carolToken);

        const bTabStorage = new DumbStorage();

        const contextB = Context.load({
            tokenScope: 'global',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(bTabStorage, 'tab'),
                tabToken: new LocalStorageCache(bTabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(carolToken);

        contextB.setToken(erickToken);

        expect(contextA.getToken()).toEqual(erickToken);
        expect(contextB.getToken()).toEqual(erickToken);
    });

    it('should share token across related tabs if the token scope is contextual', () => {
        const browserCache = new LocalStorageCache(localStorage, 'token');

        // Open the tab A
        const aTabStorage = new DumbStorage();

        const contextA = Context.load({
            tokenScope: 'contextual',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(aTabStorage, 'tab'),
                tabToken: new LocalStorageCache(aTabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        contextA.setToken(carolToken);

        // Tab A should have the carol's token
        expect(contextA.getToken()).toEqual(carolToken);

        tabEventEmulator.newTab();

        // Open tab B from tab A
        const bTabStorage = new DumbStorage();

        const contextB = Context.load({
            tokenScope: 'contextual',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(bTabStorage, 'tab'),
                tabToken: new LocalStorageCache(bTabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        // Both tabs should have carol's token
        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(carolToken);

        contextB.setToken(erickToken);

        // Tab A should still have carol's token, while tab B should have the erick's token
        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(erickToken);

        tabEventEmulator.newTab();

        // Open tab C from tab B
        const cTabStorage = new DumbStorage();

        const contextC = Context.load({
            tokenScope: 'contextual',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(cTabStorage, 'tab'),
                tabToken: new LocalStorageCache(cTabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        // Both tab B and C should have the erick's token
        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(erickToken);
        expect(contextC.getToken()).toEqual(erickToken);

        // Goes to tab A
        tabEventEmulator.switchTab(0);

        tabEventEmulator.newTab();

        // Open tab D from tab A
        const dTabStorage = new DumbStorage();

        const contextD = Context.load({
            tokenScope: 'contextual',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(dTabStorage, 'tab'),
                tabToken: new LocalStorageCache(dTabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        // Both tab A and D should have the carol's token
        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(erickToken);
        expect(contextC.getToken()).toEqual(erickToken);
        expect(contextD.getToken()).toEqual(carolToken);
    });

    it('should not share token across tabs if the token scope is isolated', () => {
        const browserCache = new LocalStorageCache(localStorage, 'token');

        const aTabStorage = new DumbStorage();

        const contextA = Context.load({
            tokenScope: 'isolated',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(aTabStorage, 'tab'),
                tabToken: new LocalStorageCache(aTabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        contextA.setToken(carolToken);

        const bTabStorage = new DumbStorage();

        const contextB = Context.load({
            tokenScope: 'isolated',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(bTabStorage, 'tab'),
                tabToken: new LocalStorageCache(bTabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toBeNull();

        contextB.setToken(erickToken);

        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(erickToken);
    });

    it('should allow setting a user token', () => {
        const tabStorage = new DumbStorage();

        const context = Context.load({
            tokenScope: 'global',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(tabStorage, 'tab'),
                tabToken: new LocalStorageCache(tabStorage, 'token'),
                browserToken: new LocalStorageCache(localStorage, 'token'),
            },
        });

        expect(context.getToken()).toBeNull();

        context.setToken(carolToken);

        expect(context.getToken()).toEqual(carolToken);
    });

    it('should provide the token subject', () => {
        const tabStorage = new DumbStorage();

        const context = Context.load({
            tokenScope: 'global',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(tabStorage, 'tab'),
                tabToken: new LocalStorageCache(tabStorage, 'token'),
                browserToken: new LocalStorageCache(localStorage, 'token'),
            },
        });

        expect(context.getUser()).toBeNull();

        context.setToken(carolToken);

        expect(context.getUser()).toEqual('c4r0l');
    });

    it('should determine whether token is from anonymous user', () => {
        const identifiedStorage = new DumbStorage();

        const identifiedContext = Context.load({
            tokenScope: 'isolated',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(identifiedStorage, 'tab'),
                tabToken: new LocalStorageCache(identifiedStorage, 'token'),
                browserToken: new LocalStorageCache(localStorage, 'token'),
            },
        });

        const anonymousStorage = new DumbStorage();

        const anonymousContext = Context.load({
            tokenScope: 'isolated',
            eventDispatcher: {
                dispatch: jest.fn(),
            },
            cache: {
                tabId: new LocalStorageCache(anonymousStorage, 'tab'),
                tabToken: new LocalStorageCache(anonymousStorage, 'token'),
                browserToken: new LocalStorageCache(localStorage, 'token'),
            },
        });

        identifiedContext.setToken(carolToken);
        anonymousContext.setToken(Token.parse('eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNG'
            + 'IzLTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0Ij'
            + 'oxNDQwOTgyOTIzfQ.'));

        expect(identifiedContext.isAnonymous()).toBeFalsy();
        expect(anonymousContext.isAnonymous()).toBeTruthy();
    });

    it.each<[TokenScope]>([
        ['isolated'],
        ['contextual'],
        ['global'],
    ])('should report token changes', (tokenScope: TokenScope) => {
        const eventDispatcher: EventDispatcher<SdkEventMap> = {dispatch: jest.fn()};

        localStorage.setItem('token', erickToken.toString());

        const context = Context.load({
            tokenScope: tokenScope,
            eventDispatcher: eventDispatcher,
            cache: {
                tabId: new LocalStorageCache(new DumbStorage(), 'tab'),
                tabToken: new LocalStorageCache(new DumbStorage(), 'token'),
                browserToken: new LocalStorageCache(localStorage, 'token'),
            },
        });

        // Set twice to ensure the event will be fired once
        context.setToken(carolToken);
        context.setToken(carolToken);

        context.setToken(null);

        expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(2);

        expect(eventDispatcher.dispatch).toHaveBeenNthCalledWith(1, 'tokenChanged', {
            oldToken: tokenScope === 'isolated' ? null : erickToken,
            newToken: carolToken,
        });

        expect(eventDispatcher.dispatch).toHaveBeenNthCalledWith(2, 'tokenChanged', {
            oldToken: carolToken,
            newToken: null,
        });
    });

    it('should report external token changes', () => {
        const browserCache = new LocalStorageCache(localStorage, 'token');
        const tabStorage = new DumbStorage();
        const eventDispatcher: EventDispatcher<SdkEventMap> = {dispatch: jest.fn()};

        browserCache.put(erickToken.toString());

        const context = Context.load({
            tokenScope: 'global',
            eventDispatcher: eventDispatcher,
            cache: {
                tabId: new LocalStorageCache(tabStorage, 'tab'),
                tabToken: new LocalStorageCache(tabStorage, 'token'),
                browserToken: browserCache,
            },
        });

        context.setToken(carolToken);

        const anonymousToken = Token.issue(appId);

        browserCache.put(anonymousToken.toString());
        browserCache.put(erickToken.toString());

        expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(3);

        expect(eventDispatcher.dispatch).toHaveBeenNthCalledWith(1, 'tokenChanged', {
            oldToken: erickToken,
            newToken: carolToken,
        });

        expect(eventDispatcher.dispatch).toHaveBeenNthCalledWith(2, 'tokenChanged', {
            oldToken: carolToken,
            newToken: anonymousToken,
        });

        expect(eventDispatcher.dispatch).toHaveBeenNthCalledWith(3, 'tokenChanged', {
            oldToken: anonymousToken,
            newToken: erickToken,
        });
    });
});
