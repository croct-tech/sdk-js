import {Tracker, EventInfo, EventListener, TrackingEventProcessor} from '../src/tracker';
import {SandboxChannel, OutputChannel} from '../src/channel';
import {TabEventEmulator} from './utils/tabEventEmulator';
import {Beacon, BeaconPayload, TrackingEvent, PartialTrackingEvent} from '../src/trackingEvents';
import {Optional} from '../src/utilityTypes';
import {Token, InMemoryTokenStore} from '../src/token';
import {Tab} from '../src/tab';
import {uuid4} from '../src/uuid';
import {NeverPolicy, RetryPolicy} from '../src/retry';

describe('A tracker', () => {
    const now = Date.now();
    const pageUrl = 'http://localhost/?foo=%22bar%22&foo="bar"';
    const pageLastModified = now;
    const pageTitle = 'Welcome to Foo Inc.';

    const tabEventEmulator = new TabEventEmulator();

    beforeEach(() => {
        const date = jest.spyOn(Date, 'now');

        date.mockReturnValue(now);

        sessionStorage.clear();
        localStorage.clear();

        tabEventEmulator.registerListeners();

        window.document.title = 'Welcome to Foo Inc.';
        window.history.replaceState({}, 'Home page', pageUrl);
        Object.defineProperty(window.document, 'lastModified', {
            value: new Date(now).toISOString(),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        tabEventEmulator.reset();
    });

    it('should determine whether it is enabled or disabled', () => {
        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab('123', true),
            channel: new SandboxChannel(),
        });

        expect(tracker.isEnabled()).toBeFalsy();

        tracker.enable();

        expect(tracker.isEnabled()).toBeTruthy();

        tracker.disable();

        expect(tracker.isEnabled()).toBeFalsy();
    });

    it('should not fail if enabled more than once', () => {
        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: new SandboxChannel(),
        });

        tracker.enable();

        expect(tracker.isEnabled()).toBeTruthy();

        tracker.enable();

        expect(tracker.isEnabled()).toBeTruthy();
    });

    it('should not fail if disabled more than once', () => {
        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: new SandboxChannel(),
        });

        expect(tracker.isEnabled()).toBeFalsy();

        tracker.disable();

        expect(tracker.isEnabled()).toBeFalsy();
    });

    it('should allow to add and remove event listeners', async () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error())
                .mockResolvedValueOnce(undefined),
        };

        const tab = new Tab(uuid4(), true);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: tab,
            channel: channel,
        });

        const listener: EventListener = jest.fn();

        tracker.addListener(listener);

        const event: TrackingEvent = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        const eventInfo: Optional<EventInfo, 'timestamp' | 'status'> = {
            context: {
                tabId: tab.id,
                url: tab.url,
            },
            event: event,
        };

        tracker.suspend();

        await expect(tracker.track(event, 1)).rejects.toThrow();

        tracker.unsuspend();

        await expect(tracker.track(event, 2)).resolves.toBeDefined();

        await expect(tracker.track(event, 3)).rejects.toThrow();

        // Listeners can be added more than once, should remove both
        tracker.addListener(listener);
        tracker.removeListener(listener);

        await expect(tracker.track(event, 4)).resolves.toBeDefined();

        expect(listener).toHaveBeenNthCalledWith(1, {
            status: 'ignored',
            timestamp: 1,
            ...eventInfo,
        });

        expect(listener).toHaveBeenNthCalledWith(2, {
            status: 'pending',
            timestamp: 2,
            ...eventInfo,
        });

        expect(listener).toHaveBeenNthCalledWith(3, {
            status: 'confirmed',
            timestamp: 2,
            ...eventInfo,
        });

        expect(listener).toHaveBeenNthCalledWith(4, {
            status: 'pending',
            timestamp: 3,
            ...eventInfo,
        });

        expect(listener).toHaveBeenNthCalledWith(5, {
            status: 'failed',
            timestamp: 3,
            ...eventInfo,
        });

        expect(listener).toHaveBeenCalledTimes(5);
    });

    it('should allow to be enabled even if it is suspended', () => {
        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: new SandboxChannel(),
        });

        tracker.suspend();

        expect(tracker.isEnabled()).toBeFalsy();
        expect(tracker.isSuspended()).toBeTruthy();

        tracker.enable();

        expect(tracker.isEnabled()).toBeTruthy();
        expect(tracker.isSuspended()).toBeTruthy();
    });

    it('should allow to be disabled even if it is suspended', () => {
        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: new SandboxChannel(),
        });

        tracker.enable();
        tracker.suspend();

        expect(tracker.isEnabled()).toBeTruthy();
        expect(tracker.isSuspended()).toBeTruthy();

        tracker.disable();

        expect(tracker.isEnabled()).toBeFalsy();
        expect(tracker.isSuspended()).toBeTruthy();
    });

    it('should determine whether it is suspended or not', () => {
        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: new SandboxChannel(),
        });

        expect(tracker.isSuspended()).toBeFalsy();

        tracker.suspend();

        expect(tracker.isSuspended()).toBeTruthy();

        tracker.unsuspend();

        expect(tracker.isSuspended()).toBeFalsy();
    });

    it('should not fail if suspended more than once', () => {
        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: new SandboxChannel(),
        });

        tracker.suspend();

        expect(tracker.isSuspended()).toBeTruthy();

        tracker.suspend();

        expect(tracker.isSuspended()).toBeTruthy();
    });

    it('should not fail if unsuspended more than once', () => {
        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: new SandboxChannel(),
        });

        expect(tracker.isSuspended()).toBeFalsy();

        tracker.unsuspend();

        expect(tracker.isSuspended()).toBeFalsy();
    });

    it('should not automatically track events if it is disabled', () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: channel,
        });

        expect(tracker.isEnabled()).toBeFalsy();

        // Trigger URL change
        window.history.pushState({}, 'New page', '/products');
        window.history.replaceState({}, 'New page', '/products');

        // Trigger content loaded
        tabEventEmulator.contentLoaded();

        // Trigger page visibility change
        tabEventEmulator.newTab();

        expect(channel.publish).not.toHaveBeenCalled();
    });

    it('should track events if it is suspended', async () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        tabEventEmulator.newTab();

        const tab = new Tab(uuid4(), true);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        tracker.suspend();

        const event: TrackingEvent = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        await expect(tracker.track(event)).rejects.toThrow('The tracker is suspended.');

        tracker.unsuspend();

        await expect(tracker.track(event)).resolves.toEqual(event);

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: window.encodeURI(window.decodeURI(pageUrl)),
            },
            payload: event,
        });

        expect(publish).toHaveBeenCalledTimes(1);
    });

    it('should report errors publishing the event', async () => {
        const publish = jest.fn().mockRejectedValue('Error.');

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        const event: TrackingEvent = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        await expect(tracker.track(event)).rejects.toEqual('Error.');
    });

    it('should include the metadata in the beacons', async () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const metadata = {
            foo: 'foo',
            bar: 'bar',
        };

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: channel,
            eventMetadata: metadata,
        });

        await tracker.track({
            type: 'nothingChanged',
            sinceTime: 0,
        });

        expect(channel.publish).toHaveBeenCalledWith(
            expect.objectContaining({
                context: expect.objectContaining({
                    metadata: metadata,
                }),
            }),
        );
    });

    it('should include the token in the beacons', async () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l');

        const store = new InMemoryTokenStore();

        store.setToken(token);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: store,
            tab: new Tab(uuid4(), true),
            channel: channel,
        });

        await tracker.track({
            type: 'nothingChanged',
            sinceTime: 0,
        });

        expect(channel.publish).toHaveBeenCalledWith(
            expect.objectContaining({
                token: token.toString(),
            }),
        );
    });

    it('should process events using the specified event processor', async () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const processor: TrackingEventProcessor = {
            process: jest.fn(
                event => [
                    {
                        ...event,
                        timestamp: event.timestamp + 1,
                    },
                    event,
                ],
            ),
        };

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: new Tab(uuid4(), true),
            channel: channel,
            processor: processor,
        });

        const event: TrackingEvent = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        const promise = tracker.track(event);

        await expect(promise).resolves.toEqual(event);

        expect(processor.process).toHaveBeenCalledWith(expect.objectContaining({
            timestamp: now,
            event: event,
        }));

        expect(channel.publish).toHaveBeenCalledTimes(2);

        expect(channel.publish).toHaveBeenNthCalledWith(1, expect.objectContaining({
            timestamp: now,
            payload: event,
        }));

        expect(channel.publish).toHaveBeenNthCalledWith(2, expect.objectContaining({
            timestamp: now + 1,
            payload: event,
        }));
    });

    it('should report ignored events', async () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const processor: TrackingEventProcessor = {
            process: jest.fn(
                event => [
                    {
                        ...event,
                        timestamp: event.timestamp + 1,
                    },
                ],
            ),
        };

        const token = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l');

        const store = new InMemoryTokenStore();

        store.setToken(token);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: store,
            tab: new Tab(uuid4(), true),
            channel: channel,
            processor: processor,
        });

        const event: TrackingEvent = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        const promise = tracker.track(event);

        await expect(promise).rejects.toThrow('Event suppressed');

        expect(processor.process).toHaveBeenCalledWith(expect.objectContaining({
            timestamp: now,
            userToken: token,
            event: event,
        }));

        expect(channel.publish).toHaveBeenCalledTimes(1);

        expect(channel.publish).toHaveBeenCalledWith(expect.objectContaining({
            timestamp: now + 1,
            payload: event,
        }));
    });

    it('should track "tabOpened" event when enabled on a tab for the first time', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const tab = new Tab(uuid4(), true);
        const store = new InMemoryTokenStore();

        let tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: store,
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        expect(publish).toHaveBeenNthCalledWith(
            1,
            {
                timestamp: now,
                context: {
                    tabId: tab.id,
                    url: window.encodeURI(window.decodeURI(pageUrl)),
                },
                payload: {
                    type: 'tabOpened',
                    tabId: tab.id,
                },
            },
        );

        publish.mockClear();

        tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: store,
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        expect(publish).not.toHaveBeenCalled();
    });

    it('should track "pageOpened" event when enabled on a page for the first time', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const store = new InMemoryTokenStore();
        const tab = new Tab(uuid4(), true);

        let tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: store,
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        expect(channel.publish).toHaveBeenNthCalledWith(
            2,
            {
                timestamp: now,
                context: {
                    tabId: tab.id,
                    url: window.encodeURI(window.decodeURI(pageUrl)),
                },
                payload: {
                    type: 'pageOpened',
                    url: window.encodeURI(window.decodeURI(pageUrl)),
                },
            },
        );

        publish.mockClear();

        tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: store,
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        expect(publish).not.toHaveBeenCalled();
    });

    it('should track "pageLoaded" event when the page loads', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const tab = new Tab(uuid4(), true);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        tabEventEmulator.contentLoaded();

        expect(publish).toHaveBeenCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: window.encodeURI(window.decodeURI(pageUrl)),
            },
            payload: {
                type: 'pageLoaded',
                title: pageTitle,
                url: window.encodeURI(window.decodeURI(pageUrl)),
                lastModifiedTime: pageLastModified,
            },
        });

        expect(publish).toHaveBeenCalledTimes(1);
    });

    it('should track "tabUrlChanged" event when the tab\'s URL changes', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const tab = new Tab(uuid4(), true);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        window.history.pushState({}, 'New page', '/products?foo=%22bar%22&foo="bar"');

        expect(publish).toHaveBeenCalledWith({
            context: {
                tabId: tab.id,
                url: 'http://localhost/products?foo=%22bar%22&foo=%22bar%22',
            },
            payload: {
                type: 'tabUrlChanged',
                tabId: tab.id,
                url: 'http://localhost/products?foo=%22bar%22&foo=%22bar%22',
            },
            timestamp: now,
        });

        expect(publish).toHaveBeenCalledTimes(1);
    });

    it('should track "tabUrlChanged" event every time the tab\'s URL changes', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const tab = new Tab(uuid4(), true);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        window.history.pushState({}, 'New page', '/products?foo=%22bar%22&foo="bar"');

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: 'http://localhost/products?foo=%22bar%22&foo=%22bar%22',
            },
            payload: {
                type: 'tabUrlChanged',
                tabId: tab.id,
                url: 'http://localhost/products?foo=%22bar%22&foo=%22bar%22',
            },
        });

        window.history.replaceState({}, 'New page', '/products/2?foo=%22bar%22&foo="bar"');

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: 'http://localhost/products/2?foo=%22bar%22&foo=%22bar%22',
            },
            payload: {
                type: 'tabUrlChanged',
                tabId: tab.id,
                url: 'http://localhost/products/2?foo=%22bar%22&foo=%22bar%22',
            },
        });

        expect(publish).toHaveBeenCalledTimes(2);
    });

    it('should track "pageVisibilityChanged" event when the page\'s visibility changes', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        tabEventEmulator.newTab();

        const tab = new Tab(uuid4(), true);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        tabEventEmulator.switchTab(0);

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: window.encodeURI(window.decodeURI(pageUrl)),
            },
            payload: {
                type: 'tabVisibilityChanged',
                tabId: tab.id,
                visibility: 'hidden',
            },
        });

        tabEventEmulator.switchTab(1);

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: window.encodeURI(window.decodeURI(pageUrl)),
            },
            payload: {
                type: 'tabVisibilityChanged',
                visibility: 'visible',
                tabId: tab.id,
            },
        });

        expect(publish).toHaveBeenCalledTimes(2);
    });

    it('should track "nothingChanged" event after an inactive period if it is not suspended', async () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const tab = new Tab(uuid4(), false);

        const retryPolicy: RetryPolicy<number> = {
            shouldRetry: jest.fn()
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false),
            getDelay: jest.fn()
                .mockReturnValueOnce(5)
                .mockReturnValueOnce(2)
                .mockReturnValueOnce(3)
                .mockReturnValueOnce(5),
        };

        const tracker = new Tracker({
            tokenProvider: new InMemoryTokenStore(),
            inactivityRetryPolicy: retryPolicy,
            tab: tab,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        // Initial inactivity (before event page opened)
        expect(retryPolicy.shouldRetry).toHaveBeenCalledWith(0, now);

        const nothingChanged: Beacon = {
            timestamp: now,
            context: {
                tabId: tab.id,
                url: window.encodeURI(window.decodeURI(pageUrl)),
            },
            payload: {
                type: 'nothingChanged',
                sinceTime: now,
            },
        };

        // First inactivity period
        await new Promise(resolve => { window.setTimeout(resolve, 3); });

        expect(publish).toHaveBeenLastCalledWith(nothingChanged);

        expect(retryPolicy.shouldRetry).toHaveBeenCalledWith(0, now);

        // Second inactivity period
        await new Promise(resolve => { window.setTimeout(resolve, 4); });

        expect(publish).toHaveBeenLastCalledWith(nothingChanged);

        expect(retryPolicy.shouldRetry).toHaveBeenCalledWith(1, now);

        // Third inactivity period
        await new Promise(resolve => { window.setTimeout(resolve, 6); });

        expect(publish).toHaveBeenLastCalledWith(nothingChanged);

        expect(retryPolicy.shouldRetry).toHaveBeenCalledWith(2, now);

        // Fourth inactivity period
        await new Promise(resolve => { window.setTimeout(resolve, 6); });

        expect(retryPolicy.shouldRetry).toHaveBeenCalledWith(3, now);

        expect(retryPolicy.shouldRetry).toHaveBeenCalledTimes(5);
        expect(publish).toHaveBeenCalledTimes(3);
    });

    it.each<[PartialTrackingEvent, BeaconPayload | undefined]>([
        [
            {
                type: 'productViewed',
                product: {
                    productId: '12345',
                    name: 'Smartphone 9',
                    displayPrice: 599.00,
                },
            },
            undefined,
        ],
        [
            {
                type: 'orderPlaced',
                order: {
                    orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                    currency: 'brl',
                    total: 776.49,
                    items: [
                        {
                            index: 0,
                            total: 699.00,
                            quantity: 1,
                            product: {
                                productId: '12345',
                                name: 'Smartphone 9',
                                displayPrice: 599.00,
                            },
                        },
                    ],
                },
            },
            undefined,
        ],
        [
            {
                type: 'cartModified',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                    lastUpdateTime: now + 10,
                },
            },
            undefined,
        ],
        [
            {
                type: 'cartModified',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                },
            },
            {
                type: 'cartModified',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                    lastUpdateTime: now,
                },
            },
        ],
        [
            {
                type: 'cartViewed',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                    lastUpdateTime: now + 10,
                },
            },
            undefined,
        ],
        [
            {
                type: 'cartViewed',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                },
            },
            {
                type: 'cartViewed',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                    lastUpdateTime: now,
                },
            },
        ],
        [
            {
                type: 'checkoutStarted',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                    lastUpdateTime: now + 10,
                },
            },
            undefined,
        ],
        [
            {
                type: 'checkoutStarted',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                },
            },
            {
                type: 'checkoutStarted',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                    lastUpdateTime: now,
                },
            },
        ],
        [
            {
                type: 'userSignedUp',
                userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: '1960-06-22',
                    gender: 'male',
                    email: 'john@doe.com',
                    alternateEmail: 'other-john@doe.com',
                    phone: '+5511987654321',
                    alternatePhone: '+5511123456789',
                    address: {
                        street: 'Kingston, 20',
                        district: 'Jardim das Americas',
                        city: 'Cuiaba',
                        region: 'MT',
                        country: 'Brasil',
                        postalCode: '00000-000',
                    },
                    avatar: 'http://croct.com/doe',
                    company: 'Croct',
                    companyUrl: 'http://croct.com',
                    jobTitle: 'CEO',
                    interests: ['enterprise'],
                    activities: ['login'],
                    custom: {
                        integer: 1,
                        number: 1.2,
                        null: null,
                        true: true,
                        false: false,
                        emptyString: '',
                        longString: 'x'.repeat(100),
                        array: [1, 1.2, null, true, false, '', 'x'.repeat(100)],
                        map: {
                            integer: 1,
                            number: 1.2,
                            null: null,
                            true: true,
                            false: false,
                            emptyString: '',
                            longString: 'x'.repeat(100),
                        },
                        nestedArrayInArray: [[1, 1.2, null, true, false, '', 'x'.repeat(100)]],
                        nestedMapInArray: [{
                            integer: 1,
                            number: 1.2,
                            null: null,
                            true: true,
                            false: false,
                            emptyString: '',
                            longString: 'x'.repeat(100),
                        }],
                        nestedArrayInMap: {foo: [1, 1.2, null, true, false, '', 'x'.repeat(100)]},
                        nestedMapInMap: {
                            foo: {
                                integer: 1,
                                number: 1.2,
                                null: null,
                                true: true,
                                false: false,
                                emptyString: '',
                                longString: 'x'.repeat(100),
                            },
                        },
                    },
                },
            },
            {
                type: 'userSignedUp',
                externalUserId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
                patch: {
                    operations: [
                        {
                            type: 'merge',
                            path: '.',
                            value: {
                                firstName: 'John',
                                lastName: 'Doe',
                                birthDate: '1960-06-22',
                                gender: 'male',
                                email: 'john@doe.com',
                                alternateEmail: 'other-john@doe.com',
                                phone: '+5511987654321',
                                alternatePhone: '+5511123456789',
                                address: {
                                    street: 'Kingston, 20',
                                    district: 'Jardim das Americas',
                                    city: 'Cuiaba',
                                    region: 'MT',
                                    country: 'Brasil',
                                    postalCode: '00000-000',
                                },
                                avatar: 'http://croct.com/doe',
                                company: 'Croct',
                                companyUrl: 'http://croct.com',
                                jobTitle: 'CEO',
                                interests: ['enterprise'],
                                activities: ['login'],
                                custom: {
                                    integer: 1,
                                    number: 1.2,
                                    null: null,
                                    true: true,
                                    false: false,
                                    emptyString: '',
                                    longString: 'x'.repeat(100),
                                    array: [1, 1.2, null, true, false, '', 'x'.repeat(100)],
                                    map: {
                                        integer: 1,
                                        number: 1.2,
                                        null: null,
                                        true: true,
                                        false: false,
                                        emptyString: '',
                                        longString: 'x'.repeat(100),
                                    },
                                    nestedArrayInArray: [[1, 1.2, null, true, false, '', 'x'.repeat(100)]],
                                    nestedMapInArray: [{
                                        integer: 1,
                                        number: 1.2,
                                        null: null,
                                        true: true,
                                        false: false,
                                        emptyString: '',
                                        longString: 'x'.repeat(100),
                                    }],
                                    nestedArrayInMap: {foo: [1, 1.2, null, true, false, '', 'x'.repeat(100)]},
                                    nestedMapInMap: {
                                        foo: {
                                            integer: 1,
                                            number: 1.2,
                                            null: null,
                                            true: true,
                                            false: false,
                                            emptyString: '',
                                            longString: 'x'.repeat(100),
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ],
        [
            {
                type: 'userSignedIn',
                userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            },
            {
                type: 'userSignedIn',
                externalUserId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            },
        ],
        [
            {
                type: 'userSignedOut',
                userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            },
            {
                type: 'userSignedOut',
                externalUserId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            },
        ],
        [
            {
                type: 'eventOccurred',
                name: 'event-name',
                details: {
                    foo: 'bar',
                },
            },
            undefined,
        ],
        [
            {
                type: 'goalCompleted',
                goalId: 'foo',
                value: 1,
                currency: 'brl',
            },
            undefined,
        ],
        [
            {
                type: 'interestShown',
                interests: ['foo'],
            },
            undefined,
        ],
        [
            {
                type: 'postViewed',
                post: {
                    postId: 'post-id',
                    title: 'post-title',
                    publishTime: now,
                },
            },
            undefined,
        ],
        [
            {
                type: 'linkOpened',
                link: 'http://www.foo.com.br/',
            },
            undefined,
        ],
        [
            {
                type: 'linkOpened',
                link: '/',
            },
            {
                type: 'linkOpened',
                link: 'http://localhost/',
            },
        ],
        [
            {
                type: 'linkOpened',
                link: './',
            },
            {
                type: 'linkOpened',
                link: 'http://localhost/',
            },
        ],
        [
            {
                type: 'linkOpened',
                link: '/bar',
            },
            {
                type: 'linkOpened',
                link: 'http://localhost/bar',
            },
        ],
        [
            {
                type: 'linkOpened',
                link: '../bar',
            },
            {
                type: 'linkOpened',
                link: 'http://localhost/bar',
            },
        ],
        [
            {
                type: 'linkOpened',
                link: 'bar?foo=baz#qux',
            },
            {
                type: 'linkOpened',
                link: 'http://localhost/bar?foo=baz#qux',
            },
        ],
        [
            {
                type: 'leadGenerated',
                leadId: 'john-doe',
                currency: 'USD',
                value: 1000.00,
                lead: {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: '1960-06-22',
                    gender: 'male',
                    email: 'john@doe.com',
                    alternateEmail: 'other-john@doe.com',
                    phone: '+5511987654321',
                    alternatePhone: '+5511123456789',
                    address: {
                        street: 'Kingston, 20',
                        district: 'Jardim das Americas',
                        city: 'Cuiaba',
                        region: 'MT',
                        country: 'Brasil',
                        postalCode: '00000-000',
                    },
                    avatar: 'http://croct.com/doe',
                    company: 'Croct',
                    companyUrl: 'http://croct.com',
                    jobTitle: 'CEO',
                    interests: ['enterprise'],
                    activities: ['login'],
                    custom: {
                        integer: 1,
                        number: 1.2,
                        null: null,
                        true: true,
                        false: false,
                        emptyString: '',
                        longString: 'x'.repeat(100),
                        array: [1, 1.2, null, true, false, '', 'x'.repeat(100)],
                        map: {
                            integer: 1,
                            number: 1.2,
                            null: null,
                            true: true,
                            false: false,
                            emptyString: '',
                            longString: 'x'.repeat(100),
                        },
                        nestedArrayInArray: [[1, 1.2, null, true, false, '', 'x'.repeat(100)]],
                        nestedMapInArray: [{
                            integer: 1,
                            number: 1.2,
                            null: null,
                            true: true,
                            false: false,
                            emptyString: '',
                            longString: 'x'.repeat(100),
                        }],
                        nestedArrayInMap: {foo: [1, 1.2, null, true, false, '', 'x'.repeat(100)]},
                        nestedMapInMap: {
                            foo: {
                                integer: 1,
                                number: 1.2,
                                null: null,
                                true: true,
                                false: false,
                                emptyString: '',
                                longString: 'x'.repeat(100),
                            },
                        },
                    },
                },
            },
            {
                type: 'leadGenerated',
                leadId: 'john-doe',
                currency: 'USD',
                value: 1000.00,
                patch: {
                    operations: [
                        {
                            type: 'merge',
                            path: '.',
                            value: {
                                firstName: 'John',
                                lastName: 'Doe',
                                birthDate: '1960-06-22',
                                gender: 'male',
                                email: 'john@doe.com',
                                alternateEmail: 'other-john@doe.com',
                                phone: '+5511987654321',
                                alternatePhone: '+5511123456789',
                                address: {
                                    street: 'Kingston, 20',
                                    district: 'Jardim das Americas',
                                    city: 'Cuiaba',
                                    region: 'MT',
                                    country: 'Brasil',
                                    postalCode: '00000-000',
                                },
                                avatar: 'http://croct.com/doe',
                                company: 'Croct',
                                companyUrl: 'http://croct.com',
                                jobTitle: 'CEO',
                                interests: ['enterprise'],
                                activities: ['login'],
                                custom: {
                                    integer: 1,
                                    number: 1.2,
                                    null: null,
                                    true: true,
                                    false: false,
                                    emptyString: '',
                                    longString: 'x'.repeat(100),
                                    array: [1, 1.2, null, true, false, '', 'x'.repeat(100)],
                                    map: {
                                        integer: 1,
                                        number: 1.2,
                                        null: null,
                                        true: true,
                                        false: false,
                                        emptyString: '',
                                        longString: 'x'.repeat(100),
                                    },
                                    nestedArrayInArray: [[1, 1.2, null, true, false, '', 'x'.repeat(100)]],
                                    nestedMapInArray: [{
                                        integer: 1,
                                        number: 1.2,
                                        null: null,
                                        true: true,
                                        false: false,
                                        emptyString: '',
                                        longString: 'x'.repeat(100),
                                    }],
                                    nestedArrayInMap: {foo: [1, 1.2, null, true, false, '', 'x'.repeat(100)]},
                                    nestedMapInMap: {
                                        foo: {
                                            integer: 1,
                                            number: 1.2,
                                            null: null,
                                            true: true,
                                            false: false,
                                            emptyString: '',
                                            longString: 'x'.repeat(100),
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ],
    ])('can track event %#', async (partialEvent: PartialTrackingEvent, beaconPayload?: BeaconPayload) => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const tab = new Tab(uuid4(), true);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: tab,
            channel: channel,
        });

        const promise = tracker.track(partialEvent);

        await expect(promise).resolves.toEqual(partialEvent);

        expect(channel.publish).toHaveBeenCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: window.encodeURI(window.decodeURI(pageUrl)),
            },
            payload: beaconPayload === undefined ? partialEvent : beaconPayload,
        });

        expect(channel.publish).toHaveBeenCalledTimes(1);
    });

    it('should provide a callback that is called when the current pending events are flushed', async () => {
        const publish = jest.fn(event => new Promise<any>(resolve => { setTimeout(() => resolve(event), 10); }));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const tab = new Tab(uuid4(), true);

        const tracker = new Tracker({
            inactivityRetryPolicy: new NeverPolicy(),
            tokenProvider: new InMemoryTokenStore(),
            tab: tab,
            channel: channel,
        });

        await expect(tracker.flushed).resolves.toBeUndefined();

        const event: TrackingEvent = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        const promise = tracker.track(event);

        await expect(tracker.flushed).resolves.toBeUndefined();

        expect(publish).toHaveBeenCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: window.encodeURI(window.decodeURI(pageUrl)),
            },
            payload: event,
        });

        await expect(promise).resolves.toEqual(event);
    });
});
