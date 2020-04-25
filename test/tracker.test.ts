import Tracker, {EventInfo, EventListener} from '../src/tracker';
import Context from '../src/context';
import Token from '../src/token';
import SandboxChannel from '../src/channel/sandboxChannel';
import TabEventEmulator from './utils/tabEventEmulator';
import {Beacon, BeaconPayload, Event, PartialEvent} from '../src/event';
import {OutputChannel} from '../src/channel';
import {DumbStorage} from './utils/dumbStorage';
import {Optional} from '../src/utilityTypes';

describe('A tracker', () => {
    const now = Date.now();
    const carolToken = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982923);
    const erickToken = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'erick', 1440982923);
    const pageUrl = 'http://localhost/';
    const pageLastModified = now;
    const pageTitle = 'Welcome to Foo Inc.';

    const tabEventEmulator = new TabEventEmulator();

    beforeEach(() => {
        const date = jest.spyOn(Date, 'now');
        date.mockReturnValue(now);

        tabEventEmulator.registerListeners();

        window.document.title = 'Welcome to Foo Inc.';
        window.history.replaceState({}, 'Home page', 'http://localhost');
        Object.defineProperty(window.document, 'lastModified', {
            value: new Date(now).toISOString(),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        tabEventEmulator.reset();
    });

    test('should determine whether it is enabled or disabled', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        expect(tracker.isEnabled()).toBeFalsy();

        tracker.enable();

        expect(tracker.isEnabled()).toBeTruthy();

        tracker.disable();

        expect(tracker.isEnabled()).toBeFalsy();
    });

    test('should not fail if enabled more than once', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        tracker.enable();

        expect(tracker.isEnabled()).toBeTruthy();

        tracker.enable();

        expect(tracker.isEnabled()).toBeTruthy();
    });

    test('should not fail if disabled more than once', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        expect(tracker.isEnabled()).toBeFalsy();

        tracker.disable();

        expect(tracker.isEnabled()).toBeFalsy();
    });

    test('should allow to add and remove event listeners', async () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error())
                .mockResolvedValueOnce(undefined),
        };
        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();
        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        const listener: EventListener = jest.fn();

        tracker.addListener(listener);

        const event: Event = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        const eventInfo: Optional<EventInfo, 'timestamp' | 'status'> = {
            context: {
                tabId: tab.id,
                url: tab.location.href,
            },
            event: event,
        };

        tracker.suspend();

        await expect(tracker.track(event, 1)).rejects.toThrowError();

        tracker.unsuspend();

        await expect(tracker.track(event, 2)).resolves.toBeDefined();

        await expect(tracker.track(event, 3)).rejects.toThrowError();

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

        expect(listener).toBeCalledTimes(5);
    });

    test('should allow to be enabled even if it is suspended', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        tracker.suspend();

        expect(tracker.isEnabled()).toBeFalsy();
        expect(tracker.isSuspended()).toBeTruthy();

        tracker.enable();

        expect(tracker.isEnabled()).toBeTruthy();
        expect(tracker.isSuspended()).toBeTruthy();
    });

    test('should allow to be disabled even if it is suspended', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
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

    test('should determine whether it is suspended or not', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        expect(tracker.isSuspended()).toBeFalsy();

        tracker.suspend();

        expect(tracker.isSuspended()).toBeTruthy();

        tracker.unsuspend();

        expect(tracker.isSuspended()).toBeFalsy();
    });

    test('should not fail if suspended more than once', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        tracker.suspend();

        expect(tracker.isSuspended()).toBeTruthy();

        tracker.suspend();

        expect(tracker.isSuspended()).toBeTruthy();
    });

    test('should not fail if unsuspended more than once', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        expect(tracker.isSuspended()).toBeFalsy();

        tracker.unsuspend();

        expect(tracker.isSuspended()).toBeFalsy();
    });

    test('should not automatically track events if it is disabled', async () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
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

    test('should track events if it is suspended', async () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        tabEventEmulator.newTab();

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        tracker.suspend();

        const event: Event = {
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
                url: pageUrl,
            },
            payload: event,
        });

        expect(publish).toHaveBeenCalledTimes(1);
    });

    test('should report errors publishing the event', async () => {
        const publish = jest.fn().mockRejectedValue('Error.');

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        const event: Event = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        await expect(tracker.track(event)).rejects.toEqual('Error.');
    });

    test('should determine whether the user is anonymous', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        expect(tracker.isUserAnonymous()).toBeTruthy();

        tracker.setToken(carolToken);

        expect(tracker.isUserAnonymous()).toBeFalsy();
    });

    test('should determine whether the context has a token', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        expect(tracker.hasToken()).toBeFalsy();

        tracker.setToken(carolToken);

        expect(tracker.hasToken()).toBeTruthy();
    });

    test('should provide the current token', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        expect(tracker.getToken()).toBeNull();

        tracker.setToken(carolToken);

        expect(tracker.getToken()).toEqual(carolToken);
    });

    test('should allow to refresh the token of the current user', () => {
        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: new SandboxChannel(),
        });

        expect(tracker.getToken()).toBeNull();

        tracker.setToken(carolToken);

        expect(tracker.getToken()).toEqual(carolToken);

        const newCarolToken = Token.issue('7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', 'c4r0l', 1440982924);

        tracker.setToken(newCarolToken);

        expect(tracker.getToken()).toEqual(newCarolToken);
    });

    test('should include the metadata in the beacons', async () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const metadata = {
            foo: 'foo',
            bar: 'bar',
        };

        const tracker = new Tracker({
            context: Context.load(new DumbStorage(), new DumbStorage(), 'isolated'),
            channel: channel,
            eventMetadata: metadata,
        });

        await tracker.track({
            type: 'nothingChanged',
            sinceTime: 0,
        });

        expect(channel.publish).toBeCalledWith(
            expect.objectContaining({
                context: expect.objectContaining({
                    metadata: metadata,
                }),
            }),
        );
    });

    test('should track "userSignedIn" event when setting a token with an identified subject', () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        expect(tracker.isUserAnonymous()).toBeTruthy();

        tracker.setToken(carolToken);

        expect(channel.publish).toHaveBeenLastCalledWith({
            timestamp: Date.now(),
            token: carolToken.toString(),
            context: {
                tabId: tab.id,
                url: pageUrl,
            },
            payload: {
                type: 'userSignedIn',
                externalUserId: 'c4r0l',
            },
        });

        tracker.setToken(carolToken);

        expect(channel.publish).toHaveBeenCalledTimes(1);
    });

    test('should track both "userSignedIn" and "userSignedOut" events when setting a token with a new subject', () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        expect(tracker.isUserAnonymous()).toBeTruthy();

        tracker.setToken(carolToken);

        expect(channel.publish).toHaveBeenLastCalledWith({
            timestamp: now,
            token: carolToken.toString(),
            context: {
                tabId: tab.id,
                url: pageUrl,
            },
            payload: {
                type: 'userSignedIn',
                externalUserId: 'c4r0l',
            },
        });

        tracker.setToken(erickToken);

        expect(channel.publish).toHaveBeenNthCalledWith(
            2,
            {
                timestamp: now,
                token: carolToken.toString(),
                context: {
                    tabId: tab.id,
                    url: pageUrl,
                },
                payload: {
                    type: 'userSignedOut',
                    externalUserId: 'c4r0l',
                },
            },
        );

        expect(channel.publish).toHaveBeenNthCalledWith(
            3,
            {
                timestamp: now,
                token: erickToken.toString(),
                context: {
                    tabId: tab.id,
                    url: pageUrl,
                },
                payload: {
                    type: 'userSignedIn',
                    externalUserId: 'erick',
                },
            },
        );

        expect(channel.publish).toHaveBeenCalledTimes(3);
    });

    test('should track "userSignedOut" event when unsetting a token with an identified subject', () => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        expect(tracker.isUserAnonymous()).toBeTruthy();

        tracker.setToken(carolToken);

        expect(channel.publish).toHaveBeenLastCalledWith({
            timestamp: now,
            token: carolToken.toString(),
            context: {
                tabId: tab.id,
                url: pageUrl,
            },
            payload: {
                type: 'userSignedIn',
                externalUserId: 'c4r0l',
            },
        });

        tracker.unsetToken();

        expect(channel.publish).toHaveBeenLastCalledWith({
            timestamp: now,
            token: carolToken.toString(),
            context: {
                tabId: tab.id,
                url: pageUrl,
            },
            payload: {
                type: 'userSignedOut',
                externalUserId: 'c4r0l',
            },
        });

        expect(channel.publish).toHaveBeenCalledTimes(2);
    });

    test('should track "tabOpened" event when enabled on a tab for the first time', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        let tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        expect(publish).toHaveBeenNthCalledWith(
            1,
            {
                timestamp: now,
                context: {
                    tabId: tab.id,
                    url: pageUrl,
                },
                payload: {
                    type: 'tabOpened',
                    tabId: tab.id,
                },
            },
        );

        publish.mockClear();

        tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        expect(publish).not.toHaveBeenCalled();
    });

    test('should track "pageOpened" event when enabled on a page for the first time', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        let tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        expect(channel.publish).toHaveBeenNthCalledWith(
            2,
            {
                timestamp: now,
                context: {
                    tabId: tab.id,
                    url: pageUrl,
                },
                payload: {
                    type: 'pageOpened',
                    url: pageUrl,
                },
            },
        );

        publish.mockClear();

        tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        expect(publish).not.toHaveBeenCalled();
    });

    test('should track "pageLoaded" event when the page loads', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        tabEventEmulator.contentLoaded();

        expect(publish).toHaveBeenCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: pageUrl,
            },
            payload: {
                type: 'pageLoaded',
                title: pageTitle,
                url: pageUrl,
                lastModifiedTime: pageLastModified,
            },
        });

        expect(publish).toHaveBeenCalledTimes(1);
    });

    test('should track "tabUrlChanged" event when the tab\'s URL changes', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        window.history.pushState({}, 'New page', '/products');

        expect(publish).toHaveBeenCalledWith({
            context: {
                tabId: tab.id,
                url: `${pageUrl}products`,
            },
            payload: {
                type: 'tabUrlChanged',
                tabId: tab.id,
                url: `${pageUrl}products`,
            },
            timestamp: now,
        });

        expect(publish).toHaveBeenCalledTimes(1);
    });

    test('should track "tabUrlChanged" event every time the tab\'s URL changes', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        window.history.pushState({}, 'New page', '/products');

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: `${pageUrl}products`,
            },
            payload: {
                type: 'tabUrlChanged',
                tabId: tab.id,
                url: `${pageUrl}products`,
            },
        });

        window.history.replaceState({}, 'New page', '/products/2');

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: `${pageUrl}products/2`,
            },
            payload: {
                type: 'tabUrlChanged',
                tabId: tab.id,
                url: `${pageUrl}products/2`,
            },
        });

        expect(publish).toHaveBeenCalledTimes(2);
    });

    test('should track "pageVisibilityChanged" event when the page\'s visibility changes', () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        tabEventEmulator.newTab();

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        tracker.enable();

        publish.mockClear();

        tabEventEmulator.switchTab(0);

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: pageUrl,
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
                url: pageUrl,
            },
            payload: {
                type: 'tabVisibilityChanged',
                visibility: 'visible',
                tabId: tab.id,
            },
        });

        expect(publish).toHaveBeenCalledTimes(2);
    });

    test('should track "nothingChanged" event after an inactive period if it is not suspended', async () => {
        const publish = jest.fn(event => Promise.resolve(event));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
            inactivityInterval: 10,
        });

        tracker.enable();

        publish.mockClear();

        await new Promise(resolve => window.setTimeout(resolve, 11));

        expect(publish).toHaveBeenLastCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: pageUrl,
            },
            payload: {
                type: 'nothingChanged',
                sinceTime: now,
            },
        });

        expect(publish).toHaveBeenCalledTimes(1);
    });

    test.each<[PartialEvent, BeaconPayload | undefined]>([
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
                    },
                },
            },
            {
                type: 'userSignedUp',
                externalUserId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
                patch: {
                    operations: [
                        {
                            type: 'set',
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
                                },
                            },
                        },
                    ],
                },
            },
        ],
        [
            {
                type: 'testGroupAssigned',
                testId: 'foo',
                groupId: 'bar',
            },
            undefined,
        ],
        [
            {
                type: 'personalizationApplied',
                personalizationId: 'foo',
                audience: 'bar',
                testId: 'baz',
                groupId: 'barbaz',
            },
            undefined,
        ],
        [
            {
                type: 'goalCompleted',
                goalId: 'foo',
                value: 1,
            },
            undefined,
        ],
    ])('can track event %#', async (partialEvent: PartialEvent, beaconPayload?: BeaconPayload) => {
        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        const promise = tracker.track(partialEvent);

        await expect(promise).resolves.toEqual(partialEvent);

        expect(channel.publish).toHaveBeenCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: pageUrl,
            },
            payload: beaconPayload === undefined ? partialEvent : beaconPayload,
        });

        expect(channel.publish).toHaveBeenCalledTimes(1);
    });

    test('should provide a callback that is called when the current pending events are flushed', async () => {
        const publish = jest.fn(event => new Promise<any>(resolve => setTimeout(() => resolve(event), 10)));

        const channel: OutputChannel<Beacon> = {
            close: jest.fn(),
            publish: publish,
        };

        const context = Context.load(new DumbStorage(), new DumbStorage(), 'isolated');
        const tab = context.getTab();

        const tracker = new Tracker({
            context: context,
            channel: channel,
        });

        await expect(tracker.flushed).resolves.toBeUndefined();

        const event: Event = {
            type: 'nothingChanged',
            sinceTime: 0,
        };

        const promise = tracker.track(event);

        await expect(tracker.flushed).resolves.toBeUndefined();

        expect(publish).toBeCalledWith({
            timestamp: now,
            context: {
                tabId: tab.id,
                url: pageUrl,
            },
            payload: event,
        });

        await expect(promise).resolves.toEqual(event);
    });
});
