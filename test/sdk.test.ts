import {WS} from 'jest-websocket-mock';
import * as fetchMock from 'fetch-mock';
import {Sdk, Configuration, VERSION} from '../src';
import {NullLogger, Logger} from '../src/logging';
import {Token} from '../src/token';
import {TabEventEmulator} from './utils/tabEventEmulator';

import {BeaconPayload, NothingChanged} from '../src/trackingEvents';
import {FetchResponse} from '../src/contentFetcher';
import {BASE_ENDPOINT_URL} from '../src/constants';

jest.mock(
    '../src/constants',
    () => ({
        VERSION: '0.0.1-test',
        BASE_ENDPOINT_URL: 'https://api.croct.io',
    }),
);

describe('A SDK', () => {
    const tabEventEmulator = new TabEventEmulator();
    const configuration: Required<Configuration> = {
        appId: '00000000-0000-0000-0000-000000000000',
        clientId: 'e6a133ffd3d2410681403d5e1bd95505',
        tokenScope: 'global',
        beaconQueueSize: 3,
        disableCidMirroring: false,
        debug: true,
        test: false,
        logger: new NullLogger(),
        urlSanitizer: jest.fn().mockImplementation((url: string) => new URL(url)),
        eventMetadata: {},
        baseEndpointUrl: 'https://localtest',
        cidAssignerEndpointUrl: 'https://localtest/cid',
    };

    const websocketEndpoint = `${configuration.baseEndpointUrl.replace(/^http/i, 'ws')}/client/web/connect`;

    // Mock Socket does not support query strings:
    // https://github.com/thoov/mock-socket/pull/231
    function creatWebSocketMock(endpoint: string): WS {
        const ws = new WS(endpoint, {jsonProtocol: true});

        window.WebSocket = class WebSocket extends window.WebSocket {
            public constructor(originalUrl: string) {
                const url = new URL(originalUrl);

                url.search = '';

                super(url.toString());
            }
        };

        return ws;
    }

    beforeEach(() => {
        tabEventEmulator.registerListeners();
    });

    afterEach(() => {
        jest.clearAllMocks();
        WS.clean();
        tabEventEmulator.reset();
        fetchMock.reset();
        localStorage.clear();
        sessionStorage.clear();
    });

    it('should validate the specified configuration', () => {
        expect(() => Sdk.init('' as unknown as Configuration))
            .toThrow('The configuration must be a key-value map.');

        expect(() => Sdk.init({} as Configuration)).toThrow('Invalid configuration');
    });

    it('should be initialized with the specified app ID', () => {
        const sdk = Sdk.init(configuration);

        expect(sdk.appId).toEqual(configuration.appId);
    });

    it('should be initialized with the specified logger', () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const sdk = Sdk.init({
            ...configuration,
            logger: logger,
        });

        const namespacedLogger = sdk.getLogger('Foo', 'Bar');

        namespacedLogger.info('Info bar');
        namespacedLogger.debug('Debug bar');
        namespacedLogger.warn('Warn bar');
        namespacedLogger.error('Error bar');

        expect(logger.info).toHaveBeenLastCalledWith('[Croct:Foo:Bar] Info bar');
        expect(logger.debug).toHaveBeenLastCalledWith('[Croct:Foo:Bar] Debug bar');
        expect(logger.warn).toHaveBeenLastCalledWith('[Croct:Foo:Bar] Warn bar');
        expect(logger.error).toHaveBeenLastCalledWith('[Croct:Foo:Bar] Error bar');
    });

    it('should configure the context with the specified URL sanitizer', () => {
        const sanitizedUrl = 'example://sanitized';
        const sanitizer = jest.fn().mockReturnValue(new URL(sanitizedUrl));

        const sdk = Sdk.init({
            ...configuration,
            urlSanitizer: sanitizer,
        });

        const tab = sdk.context.getTab();

        expect(tab.url).toBe(sanitizedUrl);
    });

    it('should configure the token storage with global scope', () => {
        const token = Token.issue(configuration.appId, 'carol');
        const key = `croct[${configuration.appId}].token`;

        const sdkTabA = Sdk.init({
            ...configuration,
            tokenScope: 'global',
        });

        const tabIndex = tabEventEmulator.newTab();

        const sdkTabB = Sdk.init({
            ...configuration,
            tokenScope: 'global',
        });

        sdkTabA.context.setToken(token);

        tabEventEmulator.dispatchEvent(
            window,
            new StorageEvent('storage', {
                bubbles: false,
                cancelable: false,
                key: key,
                oldValue: null,
                newValue: token.toString(),
                storageArea: localStorage,
            }),
            tabIndex,
        );

        expect(sdkTabA.context.getToken()).toEqual(token);
        expect(sdkTabB.context.getToken()).toEqual(token);

        sdkTabB.context.setToken(null);

        tabEventEmulator.dispatchEvent(
            window,
            new StorageEvent('storage', {
                bubbles: false,
                cancelable: false,
                key: key,
                oldValue: token.toString(),
                newValue: null,
                storageArea: localStorage,
            }),
            tabIndex - 1,
        );

        expect(sdkTabA.context.getToken()).toEqual(null);
        expect(sdkTabB.context.getToken()).toEqual(null);
    });

    it('should configure the token storage with isolated scope', () => {
        const carolToken = Token.issue(configuration.appId, 'carol');
        const erickToken = Token.issue(configuration.appId, 'erick');

        const sdkTabA = Sdk.init({
            ...configuration,
            tokenScope: 'isolated',
        });

        tabEventEmulator.newTab();

        const sdkTabB = Sdk.init({
            ...configuration,
            tokenScope: 'isolated',
        });

        sdkTabA.context.setToken(carolToken);

        expect(sdkTabA.context.getToken()).toEqual(carolToken);
        expect(sdkTabB.context.getToken()).toEqual(null);

        sdkTabB.context.setToken(erickToken);

        expect(sdkTabA.context.getToken()).toEqual(carolToken);
        expect(sdkTabB.context.getToken()).toEqual(erickToken);
    });

    it('should configure the token storage with contextual scope', () => {
        const carolToken = Token.issue(configuration.appId, 'carol');
        const erickToken = Token.issue(configuration.appId, 'erick');

        const carolTabIndex = tabEventEmulator.getTabIndex();

        const sdkTabA = Sdk.init({
            ...configuration,
            tokenScope: 'contextual',
        });

        sdkTabA.context.setToken(carolToken);

        // Opens a new tab from the tab logged as Carol
        const erickTabIndex = tabEventEmulator.newTab();

        const sdkTabB = Sdk.init({
            ...configuration,
            tokenScope: 'contextual',
        });

        expect(sdkTabA.context.getToken()).toEqual(carolToken);
        expect(sdkTabB.context.getToken()).toEqual(carolToken);

        sdkTabB.context.setToken(erickToken);

        expect(sdkTabA.context.getToken()).toEqual(carolToken);
        expect(sdkTabB.context.getToken()).toEqual(erickToken);

        // Switches to the tab logged as Carol and opens a new tab
        tabEventEmulator.switchTab(carolTabIndex);

        tabEventEmulator.newTab();

        const sdkTabC = Sdk.init({
            ...configuration,
            tokenScope: 'contextual',
        });

        expect(sdkTabC.context.getToken()).toEqual(carolToken);

        // Switches to the tab logged as Erick and opens a new tab
        tabEventEmulator.switchTab(erickTabIndex);
        tabEventEmulator.newTab();

        const sdkTabD = Sdk.init({
            ...configuration,
            tokenScope: 'contextual',
        });

        expect(sdkTabD.context.getToken()).toEqual(erickToken);
    });

    it('should configure the CID assigner with the specified endpoint', async () => {
        fetchMock.mock({
            method: 'GET',
            matcher: configuration.cidAssignerEndpointUrl,
            response: '123',
        });

        const sdk = Sdk.init({
            appId: configuration.appId,
            cidAssignerEndpointUrl: configuration.cidAssignerEndpointUrl,
            tokenScope: configuration.tokenScope,
            disableCidMirroring: false,
            debug: false,
            test: false,
        });

        await expect(sdk.cidAssigner.assignCid()).resolves.toEqual('123');
    });

    it.each([
        [undefined, `${BASE_ENDPOINT_URL}/client/web/cid`],
        [configuration.baseEndpointUrl, `${configuration.baseEndpointUrl}/client/web/cid`],
    ])(
        'should configure the CID assigner with the base endpoint',
        async (baseEndpoint: string|undefined, expectedEndpoint: string) => {
            fetchMock.mock({
                method: 'GET',
                matcher: expectedEndpoint,
                response: '123',
            });

            const sdk = Sdk.init({
                appId: configuration.appId,
                tokenScope: configuration.tokenScope,
                ...(baseEndpoint !== undefined ? {baseEndpointUrl: baseEndpoint} : {}),
                disableCidMirroring: false,
                debug: false,
                test: false,
            });

            await expect(sdk.cidAssigner.assignCid()).resolves.toEqual('123');
        },
    );

    it('should ensure that events are delivered one at a time and in order', async () => {
        fetchMock.mock({
            method: 'GET',
            matcher: configuration.cidAssignerEndpointUrl,
            response: '123',
        });

        const server = creatWebSocketMock(`${websocketEndpoint}/${configuration.appId}`);
        const receiptIds: string[] = [];

        server.on('connection', socket => {
            socket.on('message', message => {
                const {receiptId} = JSON.parse(message as unknown as string);

                receiptIds.push(receiptId);
            });
        });

        const sdk = Sdk.init(configuration);

        const firstEvent: BeaconPayload = {
            type: 'nothingChanged',
            sinceTime: Date.now() + 1,
        };

        const firstPromise = sdk.tracker.track(firstEvent);

        const secondEvent: BeaconPayload = {
            type: 'nothingChanged',
            sinceTime: Date.now() + 1,
        };

        const secondPromise = sdk.tracker.track(secondEvent);

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                payload: firstEvent,
            }),
        );

        // Wait a few milliseconds more to ensure no other message was sent
        await new Promise(resolve => { window.setTimeout(resolve, 30); });

        expect(receiptIds.length).toBe(1);

        server.send({
            receiptId: receiptIds[0],
            violations: [],
        });

        await expect(firstPromise).resolves.toBe(firstEvent);

        await expect(server).toReceiveMessage(
            expect.objectContaining({
                payload: secondEvent,
            }),
        );

        expect(receiptIds.length).toBe(2);

        server.send({
            receiptId: receiptIds[1],
            violations: [],
        });

        await expect(secondPromise).resolves.toBe(secondEvent);
    });

    it.each([
        [undefined, `${BASE_ENDPOINT_URL.replace(/^http/i, 'ws')}/client/web/connect`],
        [configuration.baseEndpointUrl, websocketEndpoint],
    ])(
        'should configure the tracker with the specified base endpoint',
        async (baseEndpoint: string|undefined, expectedEndpoint: string) => {
            fetchMock.mock({
                method: 'GET',
                matcher: configuration.cidAssignerEndpointUrl,
                response: '123',
            });

            const server = creatWebSocketMock(
                `${expectedEndpoint}/${configuration.appId}`,
            );

            server.on('connection', socket => {
                socket.on('message', message => {
                    const {receiptId} = JSON.parse(message as unknown as string);

                    server.send({
                        receiptId: receiptId,
                        violations: [],
                    });
                });
            });

            const metaName = 'foo';
            const metaValue = 'bar';

            const {baseEndpointUrl: _, ...baseConfiguration} = configuration;

            const sdk = Sdk.init({
                ...baseConfiguration,
                ...(baseEndpoint !== undefined ? {baseEndpointUrl: baseEndpoint} : {}),
                eventMetadata: {
                    [metaName]: metaValue,
                },
            });

            const event: NothingChanged = {
                type: 'nothingChanged',
                sinceTime: Date.now(),
            };

            const promise = sdk.tracker.track(event);

            await expect(promise).resolves.toEqual(event);

            await expect(server).toReceiveMessage(expect.objectContaining({
                receiptId: expect.stringMatching(/^\d+$/),
                originalTime: expect.any(Number),
                departureTime: expect.any(Number),
                context: expect.objectContaining({
                    metadata: {
                        sdkVersion: VERSION,
                        [`custom_${metaName}`]: metaValue,
                    },
                }),
            }));
        },
    );

    it.each([
        [undefined, BASE_ENDPOINT_URL],
        [configuration.baseEndpointUrl, configuration.baseEndpointUrl],
    ])(
        'should configure the evaluator',
        async (baseEndpoint: string|undefined, expectedEndpoint: string) => {
            const query = '1 + 2';
            const result = 3;

            fetchMock.mock({
                method: 'GET',
                matcher: configuration.cidAssignerEndpointUrl,
                response: '123',
            });

            fetchMock.mock({
                method: 'POST',
                matcher: `begin:${expectedEndpoint}`,
                body: {
                    query: query,
                },
                response: JSON.stringify(result),
            });

            const {baseEndpointUrl: _, ...baseConfiguration} = configuration;

            const sdk = Sdk.init({
                ...baseConfiguration,
                ...(baseEndpoint !== undefined ? {baseEndpointUrl: baseEndpoint} : {}),
            });

            const promise = sdk.evaluator.evaluate(query);

            await expect(promise).resolves.toBe(result);
        },
    );

    it.each([
        [undefined, BASE_ENDPOINT_URL],
        [configuration.baseEndpointUrl, configuration.baseEndpointUrl],
    ])(
        'should configure the content fetcher',
        async (baseEndpoint: string|undefined, expectedEndpoint: string) => {
            const slotId = 'home-banner';
            const result: FetchResponse = {
                content: {
                    title: 'Hello world',
                },
            };

            fetchMock.mock({
                method: 'GET',
                matcher: configuration.cidAssignerEndpointUrl,
                response: '123',
            });

            fetchMock.mock({
                method: 'POST',
                matcher: `begin:${expectedEndpoint}`,
                response: result,
            });

            const {baseEndpointUrl: _, ...baseConfiguration} = configuration;

            const sdk = Sdk.init({
                ...baseConfiguration,
                ...(baseEndpoint !== undefined ? {baseEndpointUrl: baseEndpoint} : {}),
            });

            const promise = sdk.contentFetcher.fetch(slotId);

            await expect(promise).resolves.toEqual(result);
        },
    );

    it('should provide a CID assigner', async () => {
        const sdk = Sdk.init(configuration);

        await expect(sdk.cidAssigner.assignCid()).resolves.toEqual(configuration.clientId);
    });

    it('should provide a user token store', () => {
        const sdk = Sdk.init(configuration);

        expect(Object.keys(localStorage)).toHaveLength(0);

        sdk.userTokenStore.setToken(Token.issue(configuration.appId, 'c4r0l'));

        expect(Object.keys(localStorage)).toHaveLength(1);
    });

    it('should provide a preview token store', () => {
        const sdk = Sdk.init(configuration);

        expect(Object.keys(localStorage)).toHaveLength(0);

        sdk.previewTokenStore.setToken(Token.issue(configuration.appId, 'c4r0l'));

        expect(Object.keys(localStorage)).toHaveLength(1);
    });

    it('should provide an event manager to allow inter-service communication', () => {
        const sdk = Sdk.init(configuration);

        const listener = jest.fn();

        sdk.eventManager.addListener('somethingHappened', listener);

        const event = {};

        sdk.eventManager.dispatch('somethingHappened', {});

        expect(listener).toHaveBeenCalledWith(event);
    });

    it('should provide an isolated session storage', () => {
        jest.spyOn(Storage.prototype, 'setItem');

        const sdk = Sdk.init(configuration);
        const storage = sdk.getTabStorage('foo', 'bar');

        storage.setItem('key', 'value');

        const namespacedKey = `croct[${configuration.appId}].external.foo.bar.key`;

        expect(window.sessionStorage.setItem).toHaveBeenCalledWith(namespacedKey, 'value');
    });

    it('should provide an isolated browser storage', () => {
        jest.spyOn(Storage.prototype, 'setItem');

        const sdk = Sdk.init(configuration);
        const storage = sdk.getBrowserStorage('foo', 'bar');

        storage.setItem('key', 'value');

        const namespacedKey = `croct[${configuration.appId}].external.foo.bar.key`;

        expect(window.localStorage.setItem).toHaveBeenCalledWith(namespacedKey, 'value');
    });

    it('should clean up resources on close', async () => {
        fetchMock.mock({
            method: 'GET',
            matcher: configuration.cidAssignerEndpointUrl,
            response: '123',
        });

        const server = creatWebSocketMock(`${websocketEndpoint}/${configuration.appId}`);

        const log = jest.fn();

        const sdk = Sdk.init({
            ...configuration,
            logger: {
                debug: log,
                info: log,
                warn: log,
                error: log,
            },
        });

        const {tracker} = sdk;

        tracker.track({
            type: 'nothingChanged',
            sinceTime: Date.now(),
        })
            .catch(() => {
                // suppress error;
            });

        const connection = await server.connected;

        await expect(sdk.close()).resolves.toBeUndefined();

        expect(connection.readyState).toBe(WebSocket.CLOSED);
        expect(tracker.isSuspended()).toBe(true);

        expect(log).toHaveBeenLastCalledWith('[Croct] SDK closed.');
    });

    it('should not fail if closed more than once', async () => {
        const sdk = Sdk.init(configuration);

        await expect(sdk.close()).resolves.toBeUndefined();
        await expect(sdk.close()).resolves.toBeUndefined();
    });
});
