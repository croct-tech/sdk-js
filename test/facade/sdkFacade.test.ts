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
import NullLogger from '../../src/logger/nullLogger';
import {ExternalEvent} from '../../src';

describe('A SDK facade', () => {
    const appId = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';

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

        SdkFacade.init({
            appId: appId,
            track: false,
            trackerEndpointUrl: 'https://api.croct.io/tracker',
            evaluationEndpointUrl: 'https://api.croct.io/evaluation',
            bootstrapEndpointUrl: 'https://api.croct.io/bootstrap',
            debug: false,
            tokenScope: 'isolated',
            token: Token.issue(appId, 'c4r0l').toString(),
        });

        expect(initialize).toBeCalledWith({
            appId: appId,
            trackerEndpointUrl: 'https://api.croct.io/tracker',
            evaluationEndpointUrl: 'https://api.croct.io/evaluation',
            bootstrapEndpointUrl: 'https://api.croct.io/bootstrap',
            debug: false,
            tokenScope: 'isolated',
        });
    });

    test('should load the SDK and set the provided token', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.setToken = jest.fn();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const carolToken = Token.issue(appId, 'c4r0l');

        SdkFacade.init({
            appId: appId,
            token: carolToken.toString(),
            track: false,
        });

        expect(tracker.setToken).toBeCalledWith(carolToken);
        expect(tracker.setToken).toBeCalledTimes(1);
    });

    test('should load the SDK and set a token for the provided user ID', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.setToken = jest.fn();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

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

        expect(tracker.setToken).toBeCalledWith(Token.issue(appId, 'c4r0l'));
        expect(tracker.setToken).toBeCalledTimes(1);
    });

    test('should load the SDK with the tracker enabled if the flag "track" is true', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.enable = jest.fn();

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
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
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
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');

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
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');

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

        expect(sdkFacade.user).toBe(sdkFacade.user);
        expect(sdkFacade.user).toStrictEqual(new UserFacade(tracker));
    });

    test('should provide a session facade', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');

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
        const context = jest.genMockFromModule<Context>('../../src/context');

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

    test('should not allow identifying a user using a non-string user ID', () => {
        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        function identify(): void {
            sdkFacade.identify(null as unknown as string);
        }

        expect(identify).toThrow(Error);
        expect(identify).toThrow('The user ID must be of type string.');
    });

    test('should allow identifying a user', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.setToken = jest.fn();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'appId', 'get').mockReturnValue(appId);
                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

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

        expect(tracker.setToken).toBeCalledWith(Token.issue(appId, 'c4r0l'));
        expect(tracker.setToken).toBeCalledTimes(1);
    });

    test('should allow anonymizing a user', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.setToken = jest.fn();
        tracker.unsetToken = jest.fn();
        tracker.isUserAnonymous = jest.fn(() => false);

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            userId: 'c4r0l',
            track: false,
        });

        sdkFacade.anonymize();

        expect(tracker.unsetToken).toBeCalledTimes(1);
    });

    test('should not allow setting an invalid token', () => {
        const sdkFacade = SdkFacade.init({
            appId: appId,
            track: false,
        });

        function setToken(): void {
            sdkFacade.setToken(null as unknown as string);
        }

        expect(setToken).toThrow(Error);
        expect(setToken).toThrow('The token must be of type string.');
    });

    test('should allow to unset a token', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.setToken = jest.fn();
        tracker.unsetToken = jest.fn();

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const sdkFacade = SdkFacade.init({
            appId: appId,
            token: Token.issue(appId, 'c4r0l').toString(),
            track: false,
        });

        sdkFacade.unsetToken();

        expect(tracker.unsetToken).toBeCalledTimes(1);
    });

    test('should allow to set a token', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.setToken = jest.fn();

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

        const carolToken = Token.issue(appId, 'c4r0l');

        sdkFacade.setToken(carolToken.toString());

        expect(tracker.setToken).toBeCalledWith(carolToken);
        expect(tracker.setToken).toBeCalledTimes(1);
    });

    test('should track events', async () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn(event => Promise.resolve(event));

        jest.spyOn(Sdk, 'init')
            .mockImplementationOnce(config => {
                const sdk = Sdk.init(config);

                jest.spyOn(sdk, 'tracker', 'get').mockReturnValue(tracker);

                return sdk;
            });

        const event: ExternalEvent = {
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

        const evaluator = jest.genMockFromModule<Evaluator>('../../src/evaluator');
        evaluator.evaluate = jest.fn(() => Promise.resolve(result));

        const context = jest.genMockFromModule<Context>('../../src/context');
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

        expect(getLogger).toHaveBeenLastCalledWith(undefined);

        sdkFacade.getLogger('foo');

        expect(getLogger).toHaveBeenLastCalledWith('foo');
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
