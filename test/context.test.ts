import Context from '../src/context';
import Token from '../src/token';
import TabEventEmulator from './utils/tabEventEmulator';
import {DumbStorage} from './utils/dumbStorage';

describe('A context', () => {
    const tabEventEmulator: TabEventEmulator = new TabEventEmulator();
    const carolToken = Token.issue('1ec38bc1-8512-4c59-a011-7cc169bf9939', 'c4r0l');
    const erickToken = Token.issue('1ec38bc1-8512-4c59-a011-7cc169bf9939', '3r1ck');

    beforeEach(() => {
        tabEventEmulator.registerListeners();
    });

    afterEach(() => {
        tabEventEmulator.reset();
        localStorage.clear();
        sessionStorage.clear();
    });

    test('should have a tab', () => {
        const context = Context.load(new DumbStorage(), new DumbStorage(), 'global');
        const tab = context.getTab();

        expect(tab.id).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/);
        expect(tab.isNew).toEqual(true);
    });

    test('should share token across all tabs if the token scope is global', () => {
        const sessionStorage = new DumbStorage();
        const applicationStorage = new DumbStorage();

        const contextA = Context.load(sessionStorage, applicationStorage, 'global');

        contextA.setToken(carolToken);

        const contextB = Context.load(sessionStorage, applicationStorage, 'global');

        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(carolToken);

        contextB.setToken(erickToken);

        expect(contextA.getToken()).toEqual(erickToken);
        expect(contextB.getToken()).toEqual(erickToken);
    });

    test('should share token across related tabs if the token scope is contextual', () => {
        const sessionStorage = new DumbStorage();
        const applicationStorage = new DumbStorage();

        // Open the tab A
        const contextA = Context.load(sessionStorage, applicationStorage, 'contextual');

        contextA.setToken(carolToken);

        // Tab A should have the carol's token
        expect(contextA.getToken()).toEqual(carolToken);

        tabEventEmulator.newTab();

        // Open tab B from tab A
        const contextB = Context.load(sessionStorage, applicationStorage, 'contextual');

        // Both tabs should have carol's token
        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(carolToken);

        contextB.setToken(erickToken);

        // Tab A should still have carol's token, while tab B should have the erick's token
        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(erickToken);

        tabEventEmulator.newTab();

        // Open tab C from tab B
        const contextC = Context.load(sessionStorage, applicationStorage, 'contextual');

        // Both tab B and C should have the erick's token
        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(erickToken);
        expect(contextC.getToken()).toEqual(erickToken);

        // Goes to tab A
        tabEventEmulator.switchTab(0);

        tabEventEmulator.newTab();

        // Open tab D from tab A
        const contextD = Context.load(sessionStorage, applicationStorage, 'contextual');

        // Both tab A and D should have the carol's token
        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(erickToken);
        expect(contextC.getToken()).toEqual(erickToken);
        expect(contextD.getToken()).toEqual(carolToken);
    });

    test('should not share token across tabs if the token scope is isolated', () => {
        const sessionStorage = new DumbStorage();
        const applicationStorage = new DumbStorage();

        const contextA = Context.load(sessionStorage, applicationStorage, 'isolated');

        contextA.setToken(carolToken);

        const contextB = Context.load(sessionStorage, applicationStorage, 'isolated');

        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toBeNull();

        contextB.setToken(erickToken);

        expect(contextA.getToken()).toEqual(carolToken);
        expect(contextB.getToken()).toEqual(erickToken);
    });

    test('should allow setting a user token', () => {
        const context = Context.load(new DumbStorage(), new DumbStorage(), 'global');

        expect(context.getToken()).toBeNull();

        context.setToken(carolToken);

        expect(context.getToken()).toEqual(carolToken);
    });

    test('should provide the token subject', () => {
        const context = Context.load(new DumbStorage(), new DumbStorage(), 'global');

        expect(context.getUser()).toBeNull();

        context.setToken(carolToken);

        expect(context.getUser()).toEqual('c4r0l');
    });

    test('should determine whether token is from anonymous user', () => {
        const identifiedContext = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const anonymousContext = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');

        identifiedContext.setToken(carolToken);
        anonymousContext.setToken(Token.parse('eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNG'
            + 'IzLTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N0LmlvIiwiaWF0Ij'
            + 'oxNDQwOTgyOTIzfQ.'));

        expect(identifiedContext.isAnonymous()).toBeFalsy();
        expect(anonymousContext.isAnonymous()).toBeTruthy();
    });
});
