import WS from 'jest-websocket-mock';
import * as fetchMock from 'fetch-mock';
import {Configuration, Container} from '../src/container';
import NullLogger from '../src/logging/nullLogger';
import {Logger} from '../src/logging';
import {BeaconPayload} from '../src/trackingEvents';
import LocalStorageCache from '../src/cache/localStorageCache'
import Token from '../src/token';

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    WS.clean();
    fetchMock.reset();
});

const configuration: Configuration = {
    appId: '00000000-0000-0000-0000-000000000000',
    tokenScope: 'global',
    beaconQueueSize: 3,
    debug: false,
    bootstrapEndpointUrl: 'https://localtest/boostrap',
    evaluationEndpointUrl: 'https://localtest/evaluate',
    trackerEndpointUrl: 'wss://localtest/connect',
};

test('should provide its configuration', () => {
    const fullConfiguration: Configuration = {
        ...configuration,
        debug: true,
        logger: new NullLogger(),
    };

    const container = new Container(fullConfiguration);

    expect(container.getConfiguration()).toEqual(fullConfiguration);
});

test('should load the context only once', () => {
    const container = new Container(configuration);

    expect(container.getContext()).toBe(container.getContext());
});

test('should load the tracker only once', () => {
    const container = new Container(configuration);

    expect(container.getTracker()).toBe(container.getTracker());
});

test('should load the evaluator only once', () => {
    const container = new Container(configuration);

    expect(container.getEvaluator()).toBe(container.getEvaluator());
});

test('should load the beacon queue only once', () => {
    const container = new Container(configuration);

    expect(container.getBeaconQueue()).toBe(container.getBeaconQueue());
});

test('should configure the event manager to notify about token changes', () => {
    const container = new Container(configuration);
    const eventManager = container.getEventManager();

    const tokenChangedListener = jest.fn();

    eventManager.addListener('tokenChanged', tokenChangedListener);

    const firstToken = Token.issue(configuration.appId);

    const context = container.getContext();

    // Set twice to ensure the listener will be called only once
    context.setToken(firstToken);
    context.setToken(firstToken);

    // Simulate a login
    const secondToken = Token.issue(configuration.appId, 'c4r0l');

    context.setToken(secondToken);

    // Then simulate switching an account from another tab
    const thirdToken = Token.issue(configuration.appId, '3r1ck');

    localStorage.setItem('croct.token', thirdToken.toString());

    window.dispatchEvent(
        new StorageEvent('storage', {
            bubbles: false,
            cancelable: false,
            key: 'croct.token',
            oldValue: secondToken.toString(),
            newValue: thirdToken.toString(),
            storageArea: localStorage,
        }),
    );

    expect(tokenChangedListener).toHaveBeenCalledTimes(3);

    expect(tokenChangedListener).toHaveBeenNthCalledWith(1, {
        newToken: firstToken,
        oldToken: null,
    });

    expect(tokenChangedListener).toHaveBeenNthCalledWith(2, {
        newToken: secondToken,
        oldToken: firstToken,
    });

    expect(tokenChangedListener).toHaveBeenNthCalledWith(3, {
        newToken: thirdToken,
        oldToken: secondToken,
    });
});

test('should flush the beacon queue on initialization', async () => {
    fetchMock.mock({
        method: 'GET',
        matcher: configuration.bootstrapEndpointUrl,
        response: '123',
    });

    let container = new Container(configuration);
    let tracker = container.getTracker();

    const payload: BeaconPayload = {
        type: 'nothingChanged',
        sinceTime: Date.now(),
    };

    const promise = tracker.track(payload);

    await container.dispose();
    await expect(promise).rejects.toThrowError();

    const server = new WS(`${configuration.trackerEndpointUrl}/${configuration.appId}`, {jsonProtocol: true});

    container = new Container(configuration);

    tracker = container.getTracker();
    tracker.enable();

    expect(server).toReceiveMessage(expect.objectContaining({payload: payload}));
});

test('should configure a fixed CID assigner if a CID is specified', async () => {
    const cid = 'e6a133ffd3d2410681403d5e1bd95505';

    const container = new Container({
        ...configuration,
        cid: cid,
    });

    const assigner = container.getCidAssigner();

    await expect(assigner.assignCid()).resolves.toBe(cid);
    await expect(assigner.assignCid()).resolves.toBe(cid);
});

test('should configure the CID assigner if a CID is not specified', async () => {
    fetchMock.mock({
        method: 'GET',
        matcher: configuration.bootstrapEndpointUrl,
        response: '123',
    });

    const container = new Container(configuration);
    const assigner = container.getCidAssigner();

    await expect(assigner.assignCid()).resolves.toBe('123');

    expect(localStorage.getItem('croct.cid')).toBe('123');
});

test('should provide an isolated tab storage', () => {
    const container = new Container({
        ...configuration,
        debug: true,
    });

    jest.spyOn(window.Storage.prototype, 'setItem');
    jest.spyOn(window.Storage.prototype, 'removeItem');

    const storage = container.getTabStorage('session', 'foo');
    storage.setItem('key', 'value');
    storage.removeItem('key');

    const namespacedKey = `croct[${configuration.appId}].external.session.foo.key`;

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(namespacedKey, 'value');
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(namespacedKey);
});

test('should provide an isolated browser storage', () => {
    const container = new Container({
        ...configuration,
        debug: true,
    });

    jest.spyOn(window.Storage.prototype, 'setItem');
    jest.spyOn(window.Storage.prototype, 'removeItem');

    const storage = container.getBrowserStorage('app', 'foo');
    storage.setItem('key', 'value');
    storage.removeItem('key');

    const namespacedKey = `croct[${configuration.appId}].external.app.foo.key`;

    expect(window.localStorage.setItem).toHaveBeenCalledWith(namespacedKey, 'value');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(namespacedKey);
});

test('should suppress log messages if no logger is specified and not in debug mode', () => {
    const debug = jest.spyOn(window.console, 'debug').mockImplementation();
    const info = jest.spyOn(window.console, 'info').mockImplementation();
    const warn = jest.spyOn(window.console, 'warn').mockImplementation();
    const error = jest.spyOn(window.console, 'error').mockImplementation();

    const container = new Container({
        ...configuration,
        debug: false,
    });

    const globalLogger = container.getLogger();

    globalLogger.info('Info bar');
    globalLogger.debug('Debug bar');
    globalLogger.warn('Warn bar');
    globalLogger.error('Error bar');

    const namespacedLogger = container.getLogger('Foo');

    namespacedLogger.info('Info bar');
    namespacedLogger.debug('Debug bar');
    namespacedLogger.warn('Warn bar');
    namespacedLogger.error('Error bar');

    expect(info).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
});

test('should provide loggers that logs to the console in debug mode', () => {
    const debug = jest.spyOn(window.console, 'debug').mockImplementation();
    const info = jest.spyOn(window.console, 'info').mockImplementation();
    const warn = jest.spyOn(window.console, 'warn').mockImplementation();
    const error = jest.spyOn(window.console, 'error').mockImplementation();

    const container = new Container({
        ...configuration,
        debug: true,
    });

    const globalLogger = container.getLogger();

    globalLogger.info('Info bar');
    globalLogger.debug('Debug bar');
    globalLogger.warn('Warn bar');
    globalLogger.error('Error bar');

    expect(info).toHaveBeenCalledWith('[Croct]', 'Info bar');
    expect(debug).toHaveBeenCalledWith('[Croct]', 'Debug bar');
    expect(warn).toHaveBeenCalledWith('[Croct]', 'Warn bar');
    expect(error).toHaveBeenCalledWith('[Croct]', 'Error bar');

    const namespacedLogger = container.getLogger('Foo', 'Bar');

    namespacedLogger.info('Info bar');
    namespacedLogger.debug('Debug bar');
    namespacedLogger.warn('Warn bar');
    namespacedLogger.error('Error bar');

    expect(info).toHaveBeenLastCalledWith('[Croct:Foo:Bar]', 'Info bar');
    expect(debug).toHaveBeenLastCalledWith('[Croct:Foo:Bar]', 'Debug bar');
    expect(warn).toHaveBeenLastCalledWith('[Croct:Foo:Bar]', 'Warn bar');
    expect(error).toHaveBeenLastCalledWith('[Croct:Foo:Bar]', 'Error bar');
});

test('should delegate logging to the provided logger', () => {
    const logger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };

    const container = new Container({
        ...configuration,
        logger: logger,
    });

    const globalLogger = container.getLogger();

    globalLogger.info('Info bar');
    globalLogger.debug('Debug bar');
    globalLogger.warn('Warn bar');
    globalLogger.error('Error bar');

    expect(logger.info).toHaveBeenCalledWith('[Croct] Info bar');
    expect(logger.debug).toHaveBeenCalledWith('[Croct] Debug bar');
    expect(logger.warn).toHaveBeenCalledWith('[Croct] Warn bar');
    expect(logger.error).toHaveBeenCalledWith('[Croct] Error bar');

    const namespacedLogger = container.getLogger('Foo');

    namespacedLogger.info('Info bar');
    namespacedLogger.debug('Debug bar');
    namespacedLogger.warn('Warn bar');
    namespacedLogger.error('Error bar');

    expect(logger.info).toHaveBeenLastCalledWith('[Croct:Foo] Info bar');
    expect(logger.debug).toHaveBeenLastCalledWith('[Croct:Foo] Debug bar');
    expect(logger.warn).toHaveBeenLastCalledWith('[Croct:Foo] Warn bar');
    expect(logger.error).toHaveBeenLastCalledWith('[Croct:Foo] Error bar');
});

test('should release managed resources once disposed', async () => {
    const {autoSync} = LocalStorageCache;

    const removeListener: jest.Mock = jest.fn();

    jest.spyOn(LocalStorageCache, 'autoSync').mockImplementation((...args) => {
        const listenerRemover = autoSync(...args);

        removeListener.mockImplementation(() => listenerRemover());

        return removeListener;
    });

    const container = new Container(configuration);

    const tracker = container.getTracker();
    const evaluator = container.getEvaluator();
    const context = container.getContext();
    const tokenProvider = container.getTokenProvider();
    const beaconQueue = container.getBeaconQueue();
    const cidAssigner = container.getCidAssigner();

    expect(LocalStorageCache.autoSync).toHaveBeenCalled();

    expect(removeListener).not.toHaveBeenCalled();

    await expect(container.dispose()).resolves.toBeUndefined();

    expect(removeListener).toHaveBeenCalled();

    expect(tracker).not.toBe(container.getTracker());
    expect(evaluator).not.toBe(container.getEvaluator());
    expect(context).not.toBe(container.getContext());
    expect(tokenProvider).not.toBe(container.getTokenProvider());
    expect(beaconQueue).not.toBe(container.getBeaconQueue());
    expect(cidAssigner).not.toBe(container.getCidAssigner());
});
