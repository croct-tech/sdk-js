import WS from 'jest-websocket-mock';
import * as fetchMock from 'fetch-mock';
import Sdk, {Configuration} from '../src/sdk';
import NullLogger from '../src/logger/nullLogger';
import Token from '../src/token';
import TabEventEmulator from './utils/tabEventEmulator';
import Logger from '../src/logger';
import {NothingChanged} from '../src/event';
import {VERSION} from '../src';

jest.mock('../src/constants', () => ({
    VERSION: '0.0.1-test',
}));

describe('A SDK', () => {
    const tabEventEmulator = new TabEventEmulator();
    const configuration: Required<Configuration> = {
        appId: '00000000-0000-0000-0000-000000000000',
        tokenScope: 'global',
        beaconQueueSize: 3,
        debug: true,
        logger: new NullLogger(),
        eventMetadata: {},
        bootstrapEndpointUrl: 'https://localtest/boostrap',
        evaluationEndpointUrl: 'https://localtest/evaluate',
        trackerEndpointUrl: 'wss://localtest/connect',
    };

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

    test('should validate the specified configuration', () => {
        expect(() => Sdk.init('' as unknown as Configuration))
            .toThrowError('The configuration must be a key-value map.');

        expect(() => Sdk.init({} as Configuration))
            .toThrowError('Invalid configuration');
    });

    test('should be initialized with the specified app ID', () => {
        const sdk = Sdk.init(configuration);

        expect(sdk.appId).toEqual(configuration.appId);
    });

    test('should be initialized with the specified logger', async () => {
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

        const namespacedLogger = sdk.getLogger('Foo');

        namespacedLogger.info('Info bar');
        namespacedLogger.debug('Debug bar');
        namespacedLogger.warn('Warn bar');
        namespacedLogger.error('Error bar');

        expect(logger.info).toHaveBeenLastCalledWith('[Croct:Foo] Info bar');
        expect(logger.debug).toHaveBeenLastCalledWith('[Croct:Foo] Debug bar');
        expect(logger.warn).toHaveBeenLastCalledWith('[Croct:Foo] Warn bar');
        expect(logger.error).toHaveBeenLastCalledWith('[Croct:Foo] Error bar');
    });

    test('should configure the token storage with global scope', async () => {
        const token = Token.issue(configuration.appId, 'carol');

        const sdkTabA = Sdk.init({
            ...configuration,
            tokenScope: 'global',
        });

        tabEventEmulator.newTab();

        const sdkTabB = Sdk.init({
            ...configuration,
            tokenScope: 'global',
        });

        sdkTabA.context.setToken(token);

        expect(sdkTabA.context.getToken()).toEqual(token);
        expect(sdkTabB.context.getToken()).toEqual(token);

        sdkTabB.context.setToken(null);

        expect(sdkTabA.context.getToken()).toEqual(null);
        expect(sdkTabB.context.getToken()).toEqual(null);
    });

    test('should configure the token storage with isolated scope', async () => {
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

    test('should configure the token storage with contextual scope', async () => {
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

    test('should configure the tracker', async () => {
        fetchMock.mock({
            method: 'HEAD',
            matcher: configuration.bootstrapEndpointUrl,
            response: '',
        });

        const server = new WS(`${configuration.trackerEndpointUrl}/${configuration.appId}`, {jsonProtocol: true});

        server.on('connection', socket => {
            socket.on('message', message => {
                const {receiptId} = JSON.parse(message as unknown as string);

                server.send({
                    receiptId: receiptId,
                    violations: [],
                });
            });
        });

        const sdk = Sdk.init({
            ...configuration,
            eventMetadata: {
                foo: 'bar',
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
                    'custom.foo': 'bar',
                },
            }),
        }));
    });

    test('should configure the evaluator', async () => {
        const expression = '1 + 2';
        const result = 3;

        fetchMock.mock({
            method: 'GET',
            matcher: configuration.evaluationEndpointUrl,
            query: {
                expression: expression,
            },
            response: JSON.stringify(result),
        });

        const sdk = Sdk.init(configuration);
        const promise = sdk.evaluator.evaluate(expression);

        await expect(promise).resolves.toBe(result);
    });

    test('should clean up resources when closed', async () => {
        fetchMock.mock({
            method: 'HEAD',
            matcher: configuration.bootstrapEndpointUrl,
            response: '',
        });

        const server = new WS(`${configuration.trackerEndpointUrl}/${configuration.appId}`, {jsonProtocol: true});

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

        tracker
            .track({
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

    test('should not fail if closed more than once', async () => {
        const sdk = Sdk.init(configuration);

        await expect(sdk.close()).resolves.toBeUndefined();
        await expect(sdk.close()).resolves.toBeUndefined();
    });
});
