import Tab from '../src/tab';
import TabEventEmulator from './utils/tabEventEmulator';

describe('A tab', () => {
    const tabId = '289fe6a5-47d0-4e83-9454-f2e8e9022baf';
    const tabEventEmulator = new TabEventEmulator();

    beforeEach(() => {
        tabEventEmulator.registerListeners();
        window.history.replaceState({}, 'Home page', 'http://localhost?foo=%22bar%22&foo="bar"');
    });

    afterEach(() => {
        jest.clearAllMocks();
        tabEventEmulator.reset();
    });

    test('should provide the page location', () => {
        const tab = new Tab(tabId, true);

        expect(tab.location).toEqual(window.location);
    });

    test('should provide the page URL', () => {
        const tab = new Tab(tabId, true);

        expect(tab.url).toEqual(window.encodeURI(window.decodeURI(window.location.href)));
    });

    test('should provide the page title', () => {
        const tab = new Tab(tabId, true);

        expect(tab.title).toEqual(document.title);
    });

    test('should provide the page referrer', () => {
        const referrer = 'http://referrer.com?foo=%22bar%22&foo="bar"';

        Object.defineProperty(window.document, 'referrer', {
            value: referrer,
            configurable: true,
        });

        const tab = new Tab(tabId, true);

        expect(tab.referrer).toEqual(window.encodeURI(window.decodeURI(referrer)));
    });

    test('should determine whether the tab is visible', () => {
        const tab = new Tab(tabId, true);

        expect(tab.isVisible).toEqual(!document.hidden);
    });

    test('should provide the page document', () => {
        const tab = new Tab(tabId, true);

        expect(tab.document).toEqual(document);
    });

    test.each([
        ['blur', new Event('blur', {bubbles: false, cancelable: false})],
        ['focus', new Event('focus', {bubbles: false, cancelable: false})],
        ['unload', new Event('beforeunload', {bubbles: true, cancelable: true})],
        ['load', new Event('DOMContentLoaded', {bubbles: true, cancelable: true})],
    ])('should emit the "%s" event', (type: any, event: Event) => {
        const tab = new Tab(tabId, true);
        const listener = jest.fn();

        tab.addListener(type, listener);

        tabEventEmulator.dispatchEvent(window, event);

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            type: type,
            detail: {tab: tab},
        }));
    });

    test('should emit the "visibilityChange" event', () => {
        const tab = new Tab(tabId, true);
        const listener = jest.fn();

        tab.addListener('visibilityChange', listener);

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'visible',
        });

        tabEventEmulator.dispatchEvent(document, new Event('visibilitychange', {bubbles: false, cancelable: false}));

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            type: 'visibilityChange',
            detail: {
                tab: tab,
                visible: true,
            },
        }));

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'hidden',
        });

        tabEventEmulator.dispatchEvent(document, new Event('visibilitychange', {bubbles: false, cancelable: false}));

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            type: 'visibilityChange',
            detail: {
                tab: tab,
                visible: false,
            },
        }));
    });

    test('should allow to add and remove listeners', () => {
        const tab = new Tab(tabId, true);
        const blurListener = jest.fn();
        const focusListener = jest.fn();

        tabEventEmulator.blur(); // should not be listened
        tabEventEmulator.focus(); // should not be listened

        tab.addListener('blur', blurListener);

        tabEventEmulator.blur(); // should be listened (1)
        tabEventEmulator.focus(); // should not be listened

        tab.removeListener('focus', focusListener);

        tabEventEmulator.blur(); // should be listened (2)
        tabEventEmulator.focus(); // should not be listened

        tab.removeListener('blur', blurListener);

        tabEventEmulator.blur(); // should not be listened
        tabEventEmulator.focus(); // should not be listened

        expect(focusListener).not.toHaveBeenCalled();
        expect(blurListener).toHaveReturnedTimes(2);
        expect(blurListener).toHaveBeenCalledWith(expect.objectContaining({
            type: 'blur',
            detail: {
                tab: tab,
            },
        }));
    });

    test('should emit the "urlChange" event on history push state', () => {
        const tab = new Tab(tabId, true);
        const listener = jest.fn();

        tab.addListener('urlChange', listener);

        window.history.pushState({}, 'Other page', '/other-page');

        expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({
            type: 'urlChange',
            detail: {
                url: 'http://localhost/other-page',
                tab: tab,
            },
        }));
    });

    test('should not emit the "urlChange" event on history push state if the page does not change', () => {
        const tab = new Tab(tabId, true);
        const listener = jest.fn();

        tab.addListener('urlChange', listener);

        window.history.pushState({}, 'Same page', tab.location.href);

        expect(listener).not.toHaveBeenCalled();
    });

    test('should emit the "urlChange" event on history replace state', () => {
        const tab = new Tab(tabId, true);
        const listener = jest.fn();

        tab.addListener('urlChange', listener);

        window.history.replaceState({}, 'Other page', '/other-page');

        expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({
            type: 'urlChange',
            detail: {
                url: 'http://localhost/other-page',
                tab: tab,
            },
        }));
    });

    test('should not emit the "urlChange" event on history replace state if the page does not change', () => {
        const tab = new Tab(tabId, true);
        const listener = jest.fn();

        tab.addListener('urlChange', listener);

        window.history.replaceState({}, 'Same page', tab.location.href);

        expect(listener).not.toHaveBeenCalled();
    });
});
