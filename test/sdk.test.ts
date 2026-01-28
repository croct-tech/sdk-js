import fetchMock, {CallLog} from 'fetch-mock';
import {RouteMatcherFunction} from 'fetch-mock/dist/esm/Matchers';
import {Sdk, Configuration} from '../src';
import {NullLogger, Logger} from '../src/logging';
import {Token} from '../src/token';
import {TabEventEmulator} from './utils/tabEventEmulator';
import {BeaconPayload, NothingChanged} from '../src/trackingEvents';
import {ContentError, ErrorResponse as ContentFetchErrorResponse, FetchResponse} from '../src/contentFetcher';
import {BASE_ENDPOINT_URL} from '../src/constants';
import {ErrorResponse as EvaluationErrorResponse, EvaluationError} from '../src/evaluator';
import {Container} from '../src/container';

jest.mock(
    '../src/constants',
    () => ({
        VERSION: '0.0.1-test',
        BASE_ENDPOINT_URL: 'https://api.croct.io',
    }),
);

describe('A SDK', () => {
    const tabEventEmulator = new TabEventEmulator();
    const configuration: Required<Omit<Configuration, 'eventProcessor'>> = {
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
        cookie: {},
        defaultFetchTimeout: 1000,
        defaultPreferredLocale: 'en-us',
    };

    beforeEach(() => {
        tabEventEmulator.registerListeners();
        fetchMock.removeRoutes();
        fetchMock.clearHistory();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        tabEventEmulator.reset();
        fetchMock.unmockGlobal();
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
        fetchMock.mockGlobal().route({
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
        async (baseEndpoint: string | undefined, expectedEndpoint: string) => {
            fetchMock.mockGlobal().route({
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
        const now = Date.now();

        function createMatcher(index: number, negated: boolean = false): RouteMatcherFunction {
            return (callLog: CallLog) => {
                const {url, options: {body}} = callLog;

                if (url !== `${configuration.baseEndpointUrl}/client/web/track`) {
                    return false;
                }

                const {payload: {sinceTime}} = JSON.parse(body as string);

                return negated ? sinceTime !== now + index : sinceTime === now + index;
            };
        }

        fetchMock.mockGlobal()
            .route({
                method: 'GET',
                matcherFunction: configuration.cidAssignerEndpointUrl,
                response: '123',
            })
            .route({
                method: 'POST',
                matcher: createMatcher(1),
                // Add a delay to ensure the second message is sent before the first one is processed
                delay: 200,
                response: {
                    ok: true,
                },
            })
            .route({
                method: 'POST',
                matcher: createMatcher(1, true),
                response: {
                    ok: true,
                },
            });

        const sdk = Sdk.init(configuration);

        const firstEvent: BeaconPayload = {
            type: 'nothingChanged',
            sinceTime: now + 1,
        };

        const firstPromise = sdk.tracker.track(firstEvent);

        const secondEvent: BeaconPayload = {
            type: 'nothingChanged',
            sinceTime: now + 2,
        };

        const secondPromise = sdk.tracker.track(secondEvent);

        await expect(Promise.all([firstPromise, secondPromise])).resolves.toEqual([firstEvent, secondEvent]);

        const calls = fetchMock.callHistory.calls();

        expect(calls).toHaveLength(2);

        const firstCall = calls[0].args[1] as {body: string};

        expect(JSON.parse(firstCall.body)).toEqual(expect.objectContaining({
            payload: firstEvent,
        }));

        const secondCall = calls[1].args[1] as {body: string};

        expect(JSON.parse(secondCall.body)).toEqual(expect.objectContaining({
            payload: secondEvent,
        }));
    });

    it.each([
        [undefined, `${BASE_ENDPOINT_URL}/client/web/track`],
        [configuration.baseEndpointUrl, `${configuration.baseEndpointUrl}/client/web/track`],
    ])(
        'should configure the tracker with the specified base endpoint',
        async (baseEndpoint: string | undefined, expectedEndpoint: string) => {
            fetchMock.mockGlobal()
                .route({
                    method: 'GET',
                    matcher: configuration.cidAssignerEndpointUrl,
                    response: '123',
                })
                .route({
                    method: 'POST',
                    matcher: expectedEndpoint,
                    response: {
                        ok: true,
                    },
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

            const lastCall = fetchMock.callHistory.lastCall();

            expect(lastCall).toBeDefined();

            const [endpoint, request] = lastCall!.args as [string, {headers: Record<string, string>, body: string}];

            expect(endpoint).toEqual(expectedEndpoint);

            expect(request.headers).toEqual(expect.objectContaining({
                'X-Client-Id': 'e6a133ffd3d2410681403d5e1bd95505',
                'X-App-Id': configuration.appId,
                'Content-Type': 'application/json',
            }));

            expect(JSON.parse(request.body as string)).toEqual(expect.objectContaining({
                payload: event,
            }));
        },
    );

    it.each([
        [undefined, BASE_ENDPOINT_URL],
        [configuration.baseEndpointUrl, configuration.baseEndpointUrl],
    ])(
        'should configure the evaluator',
        async (baseEndpoint: string | undefined, expectedEndpoint: string) => {
            const query = '1 + 2';
            const result = 3;

            fetchMock.mockGlobal()
                .route({
                    method: 'GET',
                    matcher: configuration.cidAssignerEndpointUrl,
                    response: '123',
                })
                .route({
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

    it('should configure the evaluator with the specified default timeout', async () => {
        jest.useFakeTimers();

        const query = '1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10';
        const result = 3;

        fetchMock.callHistory.calls({}, {
            method: 'GET',
            url: configuration.cidAssignerEndpointUrl,
            response: '123',
        });

        fetchMock.callHistory.calls({}, {
            method: 'POST',
            url: `begin:${configuration.baseEndpointUrl}`,
            delay: 200,
            response: JSON.stringify(result),
        });

        const sdk = Sdk.init({
            ...configuration,
            defaultFetchTimeout: 5,
        });

        const promise = sdk.evaluator.evaluate(query);

        jest.advanceTimersByTime(6);

        await expect(promise).rejects.toThrowWithMessage(
            EvaluationError,
            'Evaluation could not be completed in time for query "1 + 2 + 3 + 4 + 5 + ...".',
        );

        await expect(promise).rejects.toHaveProperty('response', expect.objectContaining({
            detail: 'The evaluation took more than 5ms to complete.',
        } satisfies Partial<EvaluationErrorResponse>));
    });

    it('should configure the evaluator with the default timeout', async () => {
        jest.useFakeTimers();

        const query = '1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10';
        const result = 3;

        fetchMock.callHistory.calls({}, {
            method: 'GET',
            url: configuration.cidAssignerEndpointUrl,
            response: '123',
        });

        fetchMock.callHistory.calls({}, {
            method: 'POST',
            url: `begin:${configuration.baseEndpointUrl}`,
            delay: Container.DEFAULT_FETCH_TIMEOUT * 2,
            response: JSON.stringify(result),
        });

        const {defaultFetchTimeout: _, ...sdkConfiguration} = configuration;

        const sdk = Sdk.init(sdkConfiguration);

        const promise = sdk.evaluator.evaluate(query);

        jest.advanceTimersByTime(Container.DEFAULT_FETCH_TIMEOUT + 1);

        await expect(promise).rejects.toThrowWithMessage(
            EvaluationError,
            'Evaluation could not be completed in time for query "1 + 2 + 3 + 4 + 5 + ...".',
        );

        await expect(promise).rejects.toHaveProperty('response', expect.objectContaining({
            detail: 'The evaluation took more than 5000ms to complete.',
        } satisfies Partial<EvaluationErrorResponse>));
    });

    it('should configure the content fetch with the default preferred locale', async () => {
        const slotId = 'home-banner';
        const result: FetchResponse = {
            metadata: {
                version: '1.0',
            },
            content: {
                title: 'Hello world',
            },
        };

        fetchMock.mockGlobal()
            .route({
                method: 'GET',
                matcher: configuration.cidAssignerEndpointUrl,
                response: '123',
            })
            .route({
                method: 'POST',
                matcher: `begin:${configuration.baseEndpointUrl}`,
                body: {
                    slotId: slotId,
                    preferredLocale: configuration.defaultPreferredLocale,
                },
                response: result,
            });

        const sdk = Sdk.init(configuration);

        const promise = sdk.contentFetcher.fetch(slotId);

        await expect(promise).resolves.toEqual(result);
    });

    it('should configure the content fetcher with the specified default timeout', async () => {
        jest.useFakeTimers();

        const slotId = 'home-banner';
        const result: FetchResponse = {
            metadata: {
                version: '1.0',
            },
            content: {
                title: 'Hello world',
            },
        };

        fetchMock.callHistory.calls({}, {
            method: 'GET',
            url: configuration.cidAssignerEndpointUrl,
            response: '123',
        });

        fetchMock.callHistory.calls({}, {
            method: 'POST',
            url: `begin:${configuration.baseEndpointUrl}`,
            delay: 200,
            response: result,
        });

        const sdk = Sdk.init({
            ...configuration,
            defaultFetchTimeout: 5,
        });

        const promise = sdk.contentFetcher.fetch(slotId);

        jest.advanceTimersByTime(6);

        await expect(promise).rejects.toThrowWithMessage(
            ContentError,
            `Content could not be loaded in time for slot '${slotId}'.`,
        );

        await expect(promise).rejects.toHaveProperty('response', expect.objectContaining({
            detail: 'The content took more than 5ms to load.',
        } satisfies Partial<ContentFetchErrorResponse>));
    });

    it('should configure the content fetcher with the default timeout', async () => {
        jest.useFakeTimers();

        const slotId = 'home-banner';
        const result: FetchResponse = {
            metadata: {
                version: '1.0',
            },
            content: {
                title: 'Hello world',
            },
        };

        fetchMock.callHistory.calls({}, {
            method: 'GET',
            url: configuration.cidAssignerEndpointUrl,
            response: '123',
        });

        fetchMock.callHistory.calls({}, {
            method: 'POST',
            url: `begin:${configuration.baseEndpointUrl}`,
            delay: Container.DEFAULT_FETCH_TIMEOUT * 2,
            response: result,
        });

        const {defaultFetchTimeout: _, ...sdkConfiguration} = configuration;

        const sdk = Sdk.init(sdkConfiguration);

        const promise = sdk.contentFetcher.fetch(slotId);

        jest.advanceTimersByTime(Container.DEFAULT_FETCH_TIMEOUT + 1);

        await expect(promise).rejects.toThrowWithMessage(
            ContentError,
            `Content could not be loaded in time for slot '${slotId}'.`,
        );

        await expect(promise).rejects.toHaveProperty('response', expect.objectContaining({
            detail: 'The content took more than 5000ms to load.',
        } satisfies Partial<ContentFetchErrorResponse>));
    });

    it.each([
        [undefined, BASE_ENDPOINT_URL],
        [configuration.baseEndpointUrl, configuration.baseEndpointUrl],
    ])(
        'should configure the content fetcher',
        async (baseEndpoint: string | undefined, expectedEndpoint: string) => {
            const slotId = 'home-banner';
            const result: FetchResponse = {
                metadata: {
                    version: '1.0',
                },
                content: {
                    title: 'Hello world',
                },
            };

            fetchMock.mockGlobal()
                .route({
                    method: 'GET',
                    matcher: configuration.cidAssignerEndpointUrl,
                    response: '123',
                })
                .route({
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
        fetchMock.callHistory.calls({}, {
            method: 'GET',
            url: configuration.cidAssignerEndpointUrl,
            response: '123',
        });

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

        await expect(sdk.close()).resolves.toBeUndefined();

        expect(tracker.isSuspended()).toBe(true);

        expect(log).toHaveBeenLastCalledWith('[Croct] SDK closed.');
    });

    it('should not fail if closed more than once', async () => {
        const sdk = Sdk.init(configuration);

        await expect(sdk.close()).resolves.toBeUndefined();
        await expect(sdk.close()).resolves.toBeUndefined();
    });
});
