import SdkFacade, {Configuration} from '../../src/facade/sdkFacade';
import Token from '../../src/token';
import Sdk from '../../src/sdk';
import Context from '../../src/context';
import UserFacade from '../../src/facade/userFacade';
import Tracker from '../../src/tracker';
import SessionFacade from '../../src/facade/sessionFacade';
import TrackerFacade from '../../src/facade/trackerFacade';
import Evaluator from '../../src/evaluator';
import Tab from '../../src/tab';
import NullLogger from '../../src/logging/nullLogger';
import {DumbStorage} from '../utils/dumbStorage';
import {ExternalTrackingEvent} from '../../src/trackingEvents';
import {SynchronousEventManager} from '../../src/eventManager';
import {SdkEventMap} from '../../src/sdkEvents';

describe('A SDK facade', () => {
    const appId = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';

    const {default: ContextMock} = jest.genMockFromModule<{default: jest.Mock<Context>}>('../../src/context');
    const {default: TrackerMock} = jest.genMockFromModule<{default: jest.Mock<Tracker>}>('../../src/tracker');

    function createContextMock(): Context {
        const context = new ContextMock();

        let token: Token|null = null;
        context.getToken = jest.fn().mockImplementation(() => token);
        context.setToken = jest.fn().mockImplementation(newToken => {
            token = newToken;
        });

        context.isAnonymous = jest.fn().mockImplementation(() => token !== null);

        return context;
    }

    beforeEach(() => {
        Object.defineProperty(window.document, 'domain', {
            value: 'localhost.dev',
            configurable: true,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should fail if the configuration is not a key-value map', () => {
        function initialize(): void {
            SdkFacade.init(null as unknown as Configuration);
        }

        expect(initialize).toThrow(Error);
        expect(initialize).toThrow('The configuration must be a key-value map.');
    });

    test('should fail if the configuration is invalid', () => {
        function initialize(): void {
            SdkFacade.init({appId: 'foo'});
        }

        expect(initialize).toThrow(Error);
        expect(initialize).toThrow('Invalid configuration:');
    });

    test('should fail if both user ID and token are specified', () => {
        function initialize(): void {
            SdkFacade.init({
                appId: appId,
                token: Token.issue(appId, 'c4r0l').toString(),
                userId: 'c4r0l',
            });
        }

        expect(initialize).toThrow(Error);
        expect(initialize).toThrow('Either the user ID or token can be specified, but not both.');
    });

    test('should load the SDK using default values for optional settings', () => {
        const initialize = jest.spyOn(Sdk, 'init');

        SdkFacade.init({appId: appId});

        expect(initialize).toBeCalledWith({
            appId: appId,
            tokenScope: 'global',
            debug: false,
        });
    });

    test('should load the SDK using the specified configuration', () => {
        const initialize = jest.spyOn(Sdk, 'init');

        const logger = new NullLogger();

        SdkFacade.init({
            appId: appId,
            track: false,
            trackerEndpointUrl: 'https://api.croct.io/tracker',
            evaluationEndpointUrl: 'https://api.croct.io/evaluation',
            bootstrapEndpointUrl: 'https://api.croct.io/bootstrap',
            debug: false,
            tokenScope: 'isolated',
            token: Token.issue(appId, 'c4r0l').toString(),
            logger: logger,
        });

        expect(initialize).toBeCalledWith({
            appId: appId,
            trackerEndpointUrl: 'https://api.croct.io/tracker',
            evaluationEndpointUrl: 'https://api.croct.io/evaluation',
            bootstrapEndpointUrl: 'https://api.croct.io/bootstrap',
            debug: false,
            tokenScope: 'isolated',
            logger: logger,
        });
    });

    test('should load the SDK and set the provided token', () => {
        const context = createContextMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const carolToken = Token.issue(appId, 'c4r0l');

        SdkFacade.init({
            appId: appId,
            token: carolToken.toString(),
            track: false,
        });

        expect(context.setToken).toBeCalledWith(carolToken);
        expect(context.setToken).toBeCalledTimes(1);
    });

    test('should load the SDK and set a token for the provided user ID', () => {
        const context = createContextMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const date = jest.spyOn(Date, 'now');
        const now = Date.now();
        date.mockReturnValue(now);

        SdkFacade.init({
            appId: appId,
            userId: 'c4r0l',
            track: false,
        });

        expect(context.setToken).toBeCalledWith(Token.issue(appId, 'c4r0l'));
        expect(context.setToken).toBeCalledTimes(1);
    });

    test('should load the SDK with the tracker enabled if the flag "track" is true', () => {
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        SdkFacade.init({
            appId: appId,
            track: true,
        });

        expect(tracker.enable).toBeCalledTimes(1);
    });

    test('should load the SDK with the tracker disabled if the flag "track" is false', () => {
        const tracker = new TrackerMock();
        tracker.enable = jest.fn();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        SdkFacade.init({
            appId: appId,
            track: false,
        });

        expect(tracker.enable).not.toHaveBeenCalled();
    });

    test('should provide a tracker facade', () => {
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        expect(sdkFacade.tracker).toBe(sdkFacade.tracker);
        expect(sdkFacade.tracker).toStrictEqual(new TrackerFacade(tracker));
    });

    test('should provide an user facade', () => {
        const tracker = new TrackerMock();
        const context = new ContextMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);
                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        expect(sdkFacade.user).toBe(sdkFacade.user);
        expect(sdkFacade.user).toStrictEqual(new UserFacade(context, tracker));
    });

    test('should provide a session facade', () => {
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        expect(sdkFacade.session).toBe(sdkFacade.session);
        expect(sdkFacade.session).toStrictEqual(new SessionFacade(tracker));
    });

    test('should provide the context', () => {
        const context = createContextMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        expect(sdkFacade.context).toBe(context);
    });

    test('should allow identifying a user', () => {
        const context = createContextMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'appId', 'get').mockReturnValue(appId);
                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const date = jest.spyOn(Date, 'now');
        const now = Date.now();
        date.mockReturnValue(now);

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        sdkFacade.identify('c4r0l');

        expect(context.setToken).toBeCalledWith(Token.issue(appId, 'c4r0l'));
        expect(context.setToken).toBeCalledTimes(1);
    });

    test('should allow anonymizing a user', () => {
        const context = createContextMock();

        let token: Token|null = null;
        context.getToken = jest.fn().mockImplementation(() => token);
        context.setToken = jest.fn().mockImplementation(newToken => {
            token = newToken;
        });

        context.isAnonymous = jest.fn(() => false);

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            userId: 'c4r0l',
            track: false,
        });

        sdkFacade.anonymize();

        expect(context.setToken).toHaveBeenLastCalledWith(null);
    });

    test('should allow to unset a token', () => {
        const context = createContextMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        sdkFacade.unsetToken();

        expect(context.setToken).toBeCalledTimes(0);

        sdkFacade.setToken(Token.issue(appId, 'c4r0l'));

        sdkFacade.unsetToken();

        expect(context.setToken).toHaveBeenLastCalledWith(null);
    });

    test('should allow to set a token', () => {
        const context = createContextMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const carolToken = Token.issue(appId, 'c4r0l');

        sdkFacade.setToken(carolToken);

        expect(context.setToken).toBeCalledWith(carolToken);
        expect(context.setToken).toBeCalledTimes(1);
    });

    test('should provide the current token', () => {
        const context = createContextMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const carolToken = Token.issue(appId, 'c4r0l');

        expect(sdkFacade.getToken()).toBeNull();

        sdkFacade.setToken(carolToken);

        expect(sdkFacade.getToken()).toEqual(carolToken);
    });

    test('should allow to refresh the token of the current anonymous user', () => {
        const context = createContextMock();
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);
                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const oldToken = Token.issue(appId, null, 1440982924);

        expect(sdkFacade.getToken()).toBeNull();

        sdkFacade.setToken(oldToken);

        expect(sdkFacade.getToken()).toEqual(oldToken);

        const newToken = Token.issue(appId, null, 1440982925);

        sdkFacade.setToken(newToken);

        expect(sdkFacade.getToken()).toEqual(newToken);

        expect(tracker.track).toBeCalledTimes(0);
    });

    test('should allow to refresh the token of the current identified user', () => {
        const context = createContextMock();
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);
                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const carolToken = Token.issue(appId, 'c4r0l');

        expect(sdkFacade.getToken()).toBeNull();

        tracker.track = jest.fn().mockResolvedValue({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });

        sdkFacade.setToken(carolToken);

        expect(sdkFacade.getToken()).toEqual(carolToken);

        const newCarolToken = Token.issue(appId, 'c4r0l', 1440982924);

        sdkFacade.setToken(newCarolToken);

        expect(sdkFacade.getToken()).toEqual(newCarolToken);

        expect(tracker.track).toBeCalledTimes(1);
        expect(tracker.track).toBeCalledWith({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });
    });

    test('should track "userSignedIn" event when setting a token with an identified subject', () => {
        const context = createContextMock();
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);
                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const carolToken = Token.issue(appId, 'c4r0l');

        tracker.track = jest.fn().mockResolvedValue({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });

        sdkFacade.setToken(carolToken);

        expect(tracker.track).toHaveBeenLastCalledWith({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });

        sdkFacade.setToken(carolToken);

        expect(tracker.track).toHaveBeenCalledTimes(1);
    });

    test('should track "userSignedIn" event when replacing an anonymous token with an identified token', () => {
        const context = createContextMock();
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);
                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        sdkFacade.setToken(Token.issue(appId));

        expect(tracker.track).toHaveBeenCalledTimes(0);

        tracker.track = jest.fn().mockResolvedValue({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });

        sdkFacade.setToken(Token.issue(appId, 'c4r0l'));

        expect(tracker.track).toHaveBeenLastCalledWith({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });

        expect(tracker.track).toHaveBeenCalledTimes(1);
    });

    test('should track both "userSignedIn" and "userSignedOut" events when setting a token with a new subject', () => {
        const context = createContextMock();
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);
                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const carolToken = Token.issue(appId, 'c4r0l');

        tracker.track = jest.fn()
            .mockResolvedValue({
                type: 'userSignedIn',
                userId: 'c4r0l',
            })
            .mockResolvedValueOnce({
                type: 'userSignedOut',
                userId: 'c4r0l',
            })
            .mockResolvedValueOnce({
                type: 'userSignedIn',
                userId: 'erick',
            });

        sdkFacade.setToken(carolToken);

        expect(tracker.track).toHaveBeenLastCalledWith({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });

        const erickToken = Token.issue(appId, 'erick');

        sdkFacade.setToken(erickToken);

        expect(tracker.track).toHaveBeenNthCalledWith(2, {
            type: 'userSignedOut',
            userId: 'c4r0l',
        });

        expect(tracker.track).toHaveBeenNthCalledWith(3, {
            type: 'userSignedIn',
            userId: 'erick',
        });

        expect(tracker.track).toHaveBeenCalledTimes(3);
    });

    test('should track "userSignedOut" event when unsetting a token with an identified subject', () => {
        const context = createContextMock();
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);
                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const carolToken = Token.issue(appId, 'c4r0l');

        tracker.track = jest.fn()
            .mockResolvedValueOnce({
                type: 'userSignedIn',
                userId: 'c4r0l',
            })
            .mockResolvedValue({
                type: 'userSignedOut',
                userId: 'c4r0l',
            });

        sdkFacade.setToken(carolToken);

        expect(tracker.track).toHaveBeenLastCalledWith({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });

        sdkFacade.unsetToken();

        expect(tracker.track).toHaveBeenLastCalledWith({
            type: 'userSignedOut',
            userId: 'c4r0l',
        });

        expect(tracker.track).toHaveBeenCalledTimes(2);
    });

    test('should track "userSignedOut" event when setting an anonymous token', () => {
        const context = createContextMock();
        const tracker = new TrackerMock();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);
                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const carolToken = Token.issue(appId, 'c4r0l');

        tracker.track = jest.fn()
            .mockResolvedValueOnce({
                type: 'userSignedIn',
                userId: 'c4r0l',
            })
            .mockResolvedValue({
                type: 'userSignedOut',
                userId: 'c4r0l',
            });

        sdkFacade.setToken(carolToken);

        expect(tracker.track).toHaveBeenLastCalledWith({
            type: 'userSignedIn',
            userId: 'c4r0l',
        });

        sdkFacade.setToken(Token.issue(appId));

        expect(tracker.track).toHaveBeenLastCalledWith({
            type: 'userSignedOut',
            userId: 'c4r0l',
        });

        expect(tracker.track).toHaveBeenCalledTimes(2);
    });

    test('should track events', async () => {
        const tracker = new TrackerMock();
        tracker.track = jest.fn(event => Promise.resolve(event));

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const event: ExternalTrackingEvent = {
            type: 'userSignedUp',
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
        };

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const promise = sdkFacade.track('userSignedUp', event);

        await expect(promise).resolves.toEqual(event);

        expect(tracker.track).toHaveBeenCalledWith(event);
        expect(tracker.track).toBeCalledTimes(1);
    });

    test('should evaluate expressions', async () => {
        const tab = new Tab('1', true);
        const result = '2';

        const {default: EvaluatorMock} = jest.genMockFromModule<{default: jest.Mock<Evaluator>}>('../../src/evaluator');
        const evaluator = new EvaluatorMock();
        evaluator.evaluate = jest.fn(() => Promise.resolve(result));

        const context = createContextMock();
        context.getTab = jest.fn(() => tab);

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'evaluator', 'get').mockReturnValue(evaluator);
                jest.spyOn(sdk, 'context', 'get').mockReturnValue(context);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        await expect(sdkFacade.evaluate('1 + 1', {timeout: 5})).resolves.toBe(result);

        expect(evaluator.evaluate).toHaveBeenCalledWith('1 + 1', expect.objectContaining({timeout: 5}));
        expect(evaluator.evaluate).toBeCalledTimes(1);
    });

    test('should provide loggers, optionally namespaced', () => {
        const logger = new NullLogger();
        const getLogger = jest.fn(() => logger);

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'getLogger').mockImplementation(getLogger);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        sdkFacade.getLogger();

        expect(getLogger).toHaveBeenCalledWith();

        sdkFacade.getLogger('foo', 'bar');

        expect(getLogger).toHaveBeenLastCalledWith('foo', 'bar');
    });

    test('should provide an isolated session storage', () => {
        const getTabStorage = jest.fn(() => new DumbStorage());

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'getTabStorage').mockImplementation(getTabStorage);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        sdkFacade.getTabStorage('a', 'b', 'c');

        expect(getTabStorage).toHaveBeenLastCalledWith('a', 'b', 'c');
    });

    test('should provide an isolated browser storage', () => {
        const getBrowserStorage = jest.fn(() => new DumbStorage());

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'getBrowserStorage').mockImplementation(getBrowserStorage);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        sdkFacade.getBrowserStorage('a', 'b', 'c');

        expect(getBrowserStorage).toHaveBeenLastCalledWith('a', 'b', 'c');
    });

    test('should assign a CID', async () => {
        const getCid = jest.fn().mockResolvedValue('123');

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'getCid').mockImplementation(getCid);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        await expect(sdkFacade.getCid()).resolves.toEqual('123');

        expect(getCid).toHaveBeenCalled();
    });

    test('should allow to subscribe and unsubscribe to events', () => {
        const eventManager = new SynchronousEventManager<SdkEventMap>();

        jest.spyOn(eventManager, 'addListener');
        jest.spyOn(eventManager, 'removeListener');

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'getEventManager').mockReturnValue(eventManager);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const listener = jest.fn();

        sdkFacade.addListener('foo.bar', listener);
        sdkFacade.removeListener('foo.bar', listener);

        expect(eventManager.addListener).toHaveBeenCalledWith('foo.bar', listener);
        expect(eventManager.removeListener).toHaveBeenCalledWith('foo.bar', listener);
    });

    test('should allow external services to dispatch custom events', () => {
        const eventManager = new SynchronousEventManager<SdkEventMap>();

        jest.spyOn(eventManager, 'dispatch');

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'getEventManager').mockReturnValue(eventManager);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        const event = {};

        sdkFacade.dispatch('foo.bar', event);

        expect(eventManager.dispatch).toHaveBeenCalledWith('foo.bar', event);
    });

    test.each<[string]>([
        [''],
        ['.'],
        ['f'],
        ['foo'],
        ['foo.'],
        ['foo.b'],
        ['foo.b'],
    ])('should only allow dispatching custom events specifying a fully-qualified name', (eventName: string) => {
        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        expect(() => sdkFacade.dispatch(eventName, {}))
            .toThrow('The event name must be in the form of "namespaced.eventName"');
    });

    test('should close the SDK on close', async () => {
        const close = jest.fn(() => Promise.resolve());

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'close').mockImplementation(close);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        await expect(sdkFacade.close()).resolves.toBeUndefined();
        expect(close).toHaveBeenCalledTimes(1);
    });
});
