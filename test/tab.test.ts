import type {UrlSanitizer} from '../src/tab';
import {Tab} from '../src/tab';
import {TabEventEmulator} from './utils/tabEventEmulator';

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

    it('should provide the page URL', () => {
        const tab = new Tab(tabId, true);

        expect(tab.url).toEqual(window.encodeURI(window.decodeURI(window.location.href)));
    });

    it('should provide a sanitized page URL', () => {
        const sanitizedUrl = 'sanitized://example';

        const sanitizer: UrlSanitizer = jest.fn().mockReturnValue(new URL(sanitizedUrl));
        const tab = new Tab(tabId, true, sanitizer);

        expect(tab.url).toEqual(sanitizedUrl);

        expect(sanitizer).toHaveBeenCalledWith(window.encodeURI(window.decodeURI(window.location.href)));
    });

    it('should provide the page title', () => {
        const tab = new Tab(tabId, true);

        expect(tab.title).toEqual(document.title);
    });

    it('should provide the page referrer', () => {
        const referrer = 'http://referrer.com?foo=%22bar%22&foo="bar"';

        Object.defineProperty(window.document, 'referrer', {
            value: referrer,
            configurable: true,
        });

        const tab = new Tab(tabId, true);

        expect(tab.referrer).toEqual(window.encodeURI(window.decodeURI(referrer)));
    });

    it('should provide a sanitized page referrer', () => {
        const referrer = 'http://referrer.com?foo=%22bar%22&foo="bar"';
        const sanitizedUrl = 'sanitized://example';

        Object.defineProperty(window.document, 'referrer', {
            value: referrer,
            configurable: true,
        });

        const sanitizer: UrlSanitizer = jest.fn().mockReturnValue(new URL(sanitizedUrl));
        const tab = new Tab(tabId, true, sanitizer);

        expect(tab.referrer).toEqual(sanitizedUrl);

        expect(sanitizer).toHaveBeenCalledWith(window.encodeURI(window.decodeURI(referrer)));
    });

    it('should not sanitize an empty page referrer', () => {
        Object.defineProperty(window.document, 'referrer', {
            value: '',
            configurable: true,
        });

        const sanitizer: UrlSanitizer = jest.fn().mockReturnValue(new URL('http://example.com'));
        const tab = new Tab(tabId, true, sanitizer);

        expect(tab.referrer).toBe('');

        expect(sanitizer).not.toHaveBeenCalled();
    });

    it('should determine whether the tab is visible', () => {
        const tab = new Tab(tabId, true);

        expect(tab.isVisible).toEqual(!document.hidden);
    });

    it('should provide the page document', () => {
        const tab = new Tab(tabId, true);

        expect(tab.document).toEqual(document);
    });

    it.each([
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

    it('should emit the "visibilityChange" event', () => {
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

    it('should allow to add and remove listeners', () => {
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

    it('should emit the "urlChange" event on history push state', () => {
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

    it('should emit the "urlChange" event with a sanitized URL on history push state', () => {
        const sanitizedUrl = 'sanitized://example';

        const sanitizer: UrlSanitizer = jest.fn().mockReturnValue(new URL(sanitizedUrl));
        const tab = new Tab(tabId, true, sanitizer);
        const listener = jest.fn();

        tab.addListener('urlChange', listener);

        window.history.pushState({}, 'Other page', '/other-page');

        expect(sanitizer).toHaveBeenCalledWith('http://localhost/other-page');

        expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({
            type: 'urlChange',
            detail: {
                url: sanitizedUrl,
                tab: tab,
            },
        }));
    });

    it('should not emit the "urlChange" event on history push state if the page does not change', () => {
        const tab = new Tab(tabId, true);
        const listener = jest.fn();

        tab.addListener('urlChange', listener);

        window.history.pushState({}, 'Same page', tab.url);

        expect(listener).not.toHaveBeenCalled();
    });

    it('should emit the "urlChange" event on history replace state', () => {
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

    it('should emit the "urlChange" event with a sanitized URL on history replace state', () => {
        const sanitizedUrl = 'sanitized://example';

        const sanitizer: UrlSanitizer = jest.fn().mockReturnValue(new URL(sanitizedUrl));
        const tab = new Tab(tabId, true, sanitizer);
        const listener = jest.fn();

        tab.addListener('urlChange', listener);

        window.history.replaceState({}, 'Other page', '/other-page');

        expect(sanitizer).toHaveBeenCalledWith('http://localhost/other-page');

        expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({
            type: 'urlChange',
            detail: {
                url: sanitizedUrl,
                tab: tab,
            },
        }));
    });

    it('should not emit the "urlChange" event on history replace state if the page does not change', () => {
        const tab = new Tab(tabId, true);
        const listener = jest.fn();

        tab.addListener('urlChange', listener);

        window.history.replaceState({}, 'Same page', tab.url);

        expect(listener).not.toHaveBeenCalled();
    });
});
