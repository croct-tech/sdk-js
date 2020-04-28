import WS from 'jest-websocket-mock';
import * as fetchMock from 'fetch-mock';
import {Configuration, Container} from '../src/container';
import NullLogger from '../src/logger/nullLogger';
import Logger from '../src/logger';
import {BeaconPayload} from '../src/event';

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    WS.clean();
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

test('should flush the beacon queue on initialization', async () => {
    fetchMock.mock({
        method: 'HEAD',
        matcher: configuration.bootstrapEndpointUrl,
        response: '',
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

test('should provide an isolated session storage', () => {
    const container = new Container({
        ...configuration,
        debug: true,
    });

    jest.spyOn(window.Storage.prototype, 'setItem');
    jest.spyOn(window.Storage.prototype, 'removeItem');

    const storage = container.getSessionStorage('session', 'foo');
    storage.setItem('key', 'value');
    storage.removeItem('key');

    const namespacedKey = `${configuration.appId}.external.session.foo.key`;

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(namespacedKey, 'value');
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(namespacedKey);
});

test('should provide an isolated application storage', () => {
    const container = new Container({
        ...configuration,
        debug: true,
    });

    jest.spyOn(window.Storage.prototype, 'setItem');
    jest.spyOn(window.Storage.prototype, 'removeItem');

    const storage = container.getApplicationStorage('app', 'foo');
    storage.setItem('key', 'value');
    storage.removeItem('key');

    const namespacedKey = `${configuration.appId}.external.app.foo.key`;

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
    const container = new Container(configuration);

    const tracker = container.getTracker();
    const evaluator = container.getEvaluator();
    const context = container.getContext();
    const beaconQueue = container.getBeaconQueue();

    await expect(container.dispose()).resolves.toBeUndefined();

    expect(tracker).not.toBe(container.getTracker());
    expect(evaluator).not.toBe(container.getEvaluator());
    expect(context).not.toBe(container.getContext());
    expect(beaconQueue).not.toBe(container.getBeaconQueue());
});
