import type {CallLog, UserRouteConfig} from 'fetch-mock';
import fetchMock from 'fetch-mock';
import type {PublishRequest} from '../src/eventPublisher';
import {EventPublisher, PublishError, PublishErrorType} from '../src/eventPublisher';
import type {ApiProblem} from '../src/error';
import {Token} from '../src/token';
import {BASE_ENDPOINT_URL, CLIENT_LIBRARY} from '../src/constants';
import {ApiKey} from '../src/apiKey';
import type {Logger} from '../src/logging';
import {Help} from '../src/help';

jest.mock(
    '../src/constants',
    () => ({
        ...jest.requireActual('../src/constants'),
        BASE_ENDPOINT_URL: 'https://track.example.com',
    }),
);

describe('An event publisher', () => {
    const now = Date.now();
    const appId = '06e3d5fb-cdfd-4270-8eba-de7a7bb04b5f';
    const apiKey = ApiKey.parse(
        '00000000-0000-0000-0000-000000000000:ES256;'
        + 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg3TbbvRM7DNwxY3XGWDmlSRPSfZ9b+ch9TO3jQ68Zyj+'
        + 'hRANCAASmJj/EiEhUaLAWnbXMTb/85WADkuFgoELGZ5ByV7YPlbb2wY6oLjzGkpF6z8iDrvJ4kV6EhaJ4n0HwSQckVLNE',
    );
    const apiKeyIdentifier = apiKey.getIdentifier();
    const plainTextApiKey = `${apiKey.getIdentifier()}:${apiKey.getPrivateKey()}`;

    const tabId = '4b3c9b0e-8c3f-4d8f-9e5a-2b1c7d6e5f4a';
    const clientId = 'c3b5b9f0-5f9a-4b3c-8c9c-8b5c8b5c8b5c';
    const timestamp = now - 1000;
    const pageUrl = 'https://example.com/products/42';

    const metadata = {
        clientId: clientId,
        timestamp: timestamp,
        context: {
            tabId: tabId,
            url: pageUrl,
        },
    };

    const request: PublishRequest<'goalCompleted'> = {
        ...metadata,
        type: 'goalCompleted',
        payload: {
            goalId: 'signup',
            value: 10,
        },
    };

    const event = {
        type: 'goalCompleted',
        goalId: 'signup',
        value: 10,
    };

    const requestMatcher: UserRouteConfig = {
        url: `${BASE_ENDPOINT_URL}/client/web/track`,
        matcherFunction: (callLog: CallLog) => callLog?.options.mode === 'cors',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-Library': CLIENT_LIBRARY,
            'X-Client-Id': clientId,
            'X-App-Id': appId,
        },
        body: {
            context: {
                tabId: tabId,
                url: pageUrl,
            },
            payload: event,
            originalTime: timestamp,
            departureTime: now,
        },
    };

    function createLogger(): Logger {
        return {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
    }

    function getLastBody(): Record<string, any> {
        const call = fetchMock.callHistory.lastCall();

        expect(call).toBeDefined();

        return JSON.parse(String(call!.options.body));
    }

    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(now);

        fetchMock.removeRoutes();
        fetchMock.clearHistory();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        fetchMock.unmockGlobal();
    });

    it('should require either an application ID or API key', () => {
        expect(() => new EventPublisher({}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should require either an application ID or API key, but not both', () => {
        expect(() => new EventPublisher({apiKey: apiKeyIdentifier, appId: appId}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should publish an event using the application ID', async () => {
        const publisher = new EventPublisher({appId: appId});

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: 200,
        });

        await expect(publisher.publish(request)).resolves.toBeUndefined();
    });

    it('should use the specified base endpoint', async () => {
        const customEndpoint = 'https://custom.example.com/';

        const publisher = new EventPublisher({
            appId: appId,
            baseEndpointUrl: customEndpoint,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            url: 'https://custom.example.com/client/web/track',
            response: 200,
        });

        await expect(publisher.publish(request)).resolves.toBeUndefined();
    });

    it.each<[string, string | ApiKey]>([
        ['an API key', apiKey],
        ['a plain-text API key identifier', apiKeyIdentifier],
        ['a plain-text API key', plainTextApiKey],
    ])('should use the external endpoint passing %s', async (_, value) => {
        const publisher = new EventPublisher({apiKey: value});

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            url: `${BASE_ENDPOINT_URL}/external/web/track`,
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Library': CLIENT_LIBRARY,
                'X-Client-Id': clientId,
                'X-Api-Key': apiKeyIdentifier,
            },
            response: 200,
        });

        await expect(publisher.publish(request)).resolves.toBeUndefined();

        const call = fetchMock.callHistory.lastCall();

        expect(call!.options.headers).not.toHaveProperty('x-app-id');
    });

    it('should forward the optional client information and user token', async () => {
        const publisher = new EventPublisher({appId: appId});
        const token = Token.issue(appId, 'foo', now);

        const clientIp = '192.168.0.1';
        const clientAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Ip': clientIp,
                'X-Client-Agent': clientAgent,
                'X-Token': token.toString(),
            },
            response: 200,
        });

        const promise = publisher.publish({
            ...request,
            clientIp: clientIp,
            clientAgent: clientAgent,
            userToken: token,
        });

        await expect(promise).resolves.toBeUndefined();
    });

    it('should not send optional headers when not provided', async () => {
        const publisher = new EventPublisher({appId: appId});

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: 200,
        });

        await publisher.publish(request);

        expect(fetchMock.callHistory.lastCall()!.options.headers).toStrictEqual({
            'content-type': 'application/json',
            'x-app-id': appId,
            'x-client-id': clientId,
            'x-client-library': CLIENT_LIBRARY,
        });
    });

    it('should forward the time zone and metadata of the context', async () => {
        const publisher = new EventPublisher({appId: appId});

        const context = {
            tabId: tabId,
            url: pageUrl,
            timeZone: 'America/Sao_Paulo',
            metadata: {foo: 'bar'},
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                context: context,
            },
            response: 200,
        });

        await expect(publisher.publish({...request, context: context})).resolves.toBeUndefined();
    });

    it.each<[string, PublishRequest]>([
        [
            'identified user events',
            {...metadata, type: 'userSignedIn', payload: {externalUserId: 'c4r0l'}},
        ],
        [
            'sign-up events with a profile patch',
            {
                ...metadata,
                type: 'userSignedUp',
                payload: {
                    externalUserId: 'c4r0l',
                    patch: {operations: [{type: 'merge', path: '.', value: {firstName: 'Carol'}}]},
                },
            },
        ],
        [
            'lead events with a lead patch',
            {
                ...metadata,
                type: 'leadGenerated',
                payload: {
                    leadId: '123',
                    patch: {operations: [{type: 'merge', path: '.', value: {firstName: 'Carol'}}]},
                },
            },
        ],
        [
            'link events with relative links',
            {...metadata, type: 'linkOpened', payload: {link: '/checkout'}},
        ],
        [
            'cart events',
            {
                ...metadata,
                type: 'cartViewed',
                payload: {cart: {currency: 'USD', total: 10, items: [], lastUpdateTime: timestamp}},
            },
        ],
    ])('should send the payload of %s as given', async (_, input) => {
        const publisher = new EventPublisher({appId: appId});

        fetchMock.mockGlobal().route(`${BASE_ENDPOINT_URL}/client/web/track`, 200);

        await expect(publisher.publish(input)).resolves.toBeUndefined();

        expect(getLastBody().payload).toStrictEqual({...input.payload, type: input.type});
    });

    it('should fetch using the extra options', async () => {
        const publisher = new EventPublisher({appId: appId});

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: 200,
        });

        const overridableOptions: RequestInit = {
            credentials: 'include',
            keepalive: true,
        };

        // Loosely typed to simulate options that bypass the type checks
        const nonOverridableOptions: Record<string, unknown> = {
            method: 'GET',
            headers: {
                invalid: 'header',
            },
            signal: undefined,
            body: 'invalid body',
        };

        await publisher.publish(request, {
            extra: {...overridableOptions, ...nonOverridableOptions},
        });

        const call = fetchMock.callHistory.lastCall();

        expect(call!.options).toEqual(expect.objectContaining(overridableOptions));
        expect(call!.options).not.toEqual(expect.objectContaining(nonOverridableOptions));
    });

    it('should resolve and log a warning when tracking is suspended', async () => {
        const logger = createLogger();
        const publisher = new EventPublisher({appId: appId, logger: logger});

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: 202,
        });

        await expect(publisher.publish(request)).resolves.toBeUndefined();

        expect(logger.warn).toHaveBeenCalledWith(Help.forStatusCode(202));
    });

    it('should reject with the problem reported by the API', async () => {
        const logger = createLogger();
        const publisher = new EventPublisher({appId: appId, logger: logger});

        const problem: ApiProblem = {
            type: 'https://croct.help/api/authentication/quota-exceeded',
            title: 'Quota exceeded.',
            status: 403,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: 403,
                body: problem,
            },
        });

        const promise = publisher.publish(request);

        await expect(promise).rejects.toThrowWithMessage(PublishError, problem.title);
        await expect(promise).rejects.toHaveProperty('response', problem);

        expect(logger.error).toHaveBeenCalledWith(Help.forApiProblem(problem));
    });

    it.each([
        [500, 'Internal Server Error'],
        [400, 'Bad Request'],
    ])('should reject with the response status %i when the error response is not valid JSON', async (status, title) => {
        const publisher = new EventPublisher({appId: appId});

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: status,
                body: 'Not JSON',
            },
        });

        const promise = publisher.publish(request);

        await expect(promise).rejects.toThrowWithMessage(PublishError, title);
        await expect(promise).rejects.toHaveProperty('response', {
            title: title,
            type: PublishErrorType.INTERNAL_ERROR,
            status: status,
        });
    });

    it('should reject with an internal error when the request fails', async () => {
        const publisher = new EventPublisher({appId: appId});

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                throws: new Error('Network error'),
            },
        });

        const promise = publisher.publish(request);

        await expect(promise).rejects.toHaveProperty('response', {
            title: 'Network error',
            type: PublishErrorType.INTERNAL_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        });
    });

    it('should abort the request if the timeout is reached', async () => {
        jest.useFakeTimers();

        const logger = createLogger();
        const publisher = new EventPublisher({
            appId: appId,
            logger: logger,
            // Ensure the specified timeout has precedence over the default timeout
            defaultTimeout: 15,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            delay: 20,
            response: 200,
        });

        const promise = publisher.publish(request, {timeout: 10});

        jest.advanceTimersByTime(11);

        const lastCall = fetchMock.callHistory.lastCall();

        expect(lastCall!.options.signal?.aborted).toBeTrue();

        await expect(promise).rejects.toThrow(PublishError);
        await expect(promise).rejects.toHaveProperty('response', {
            title: 'Event "goalCompleted" could not be published in time.',
            type: PublishErrorType.TIMEOUT,
            detail: 'The request took more than 10ms to complete.',
            status: 408,
        });

        expect(logger.error).toHaveBeenCalledWith(Help.forStatusCode(408));
    });

    it('should use the default timeout if none is specified', async () => {
        jest.useFakeTimers();

        const publisher = new EventPublisher({appId: appId, defaultTimeout: 10});

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            delay: 20,
            response: 200,
        });

        const promise = publisher.publish(request);

        jest.advanceTimersByTime(11);

        await expect(promise).rejects.toHaveProperty('response.type', PublishErrorType.TIMEOUT);
    });

    it('should not be serializable', () => {
        expect(() => {
            new EventPublisher({appId: appId}).toJSON();
        }).toThrowWithMessage(Error, 'Unserializable value.');
    });
});
