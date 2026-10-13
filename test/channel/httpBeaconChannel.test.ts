import fetchMock from '@fetch-mock/jest';
import {HttpBeaconChannel, MessageDeliveryError} from '../../src/channel';
import type {Logger} from '../../src/logging';
import {FixedAssigner} from '../../src/cid';
import type {Beacon} from '../../src/trackingEvents';
import {Token} from '../../src/token';
import {CLIENT_LIBRARY} from '../../src/constants';
import {Help} from '../../src/help';
import {EventPublisher} from '../../src/eventPublisher';

describe('An HTTP beacon channel', () => {
    beforeEach(() => {
        fetchMock.removeRoutes();
        fetchMock.clearHistory();
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    afterEach(() => {
        fetchMock.unmockGlobal();
    });

    const appId = '00000000-0000-0000-0000-000000000000';
    const clientId = '00000000-0000-0000-0000-000000000001';
    const tabId = '00000000-0000-0000-0000-000000000002';
    const cidAssigner = new FixedAssigner(clientId);

    const logger: Logger = {
        debug: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    };

    const baseEndpointUrl = 'http://api.croct.io';
    const endpointUrl = `${baseEndpointUrl}/client/web/track`;

    function createPublisher(): EventPublisher {
        return new EventPublisher({
            appId: appId,
            baseEndpointUrl: baseEndpointUrl,
            logger: logger,
        });
    }

    it('should send a beacon to the specified URL', async () => {
        fetchMock.mockGlobal().route(endpointUrl, 200);

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
        });

        jest.useFakeTimers({now: 2});

        const beacon: Beacon = {
            context: {
                tabId: tabId,
                url: 'http://example.com',
            },
            payload: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
            token: Token.issue(appId).toString(),
            timestamp: 1,
        };

        const listener = jest.fn();

        channel.subscribe(listener);

        const receiptId = 'receipt-id';

        const promise = channel.publish({
            id: receiptId,
            message: JSON.stringify(beacon),
        });

        await expect(promise).resolves.toBeUndefined();

        expect(listener).toHaveBeenCalledWith(receiptId);

        const calls = fetchMock.callHistory.calls();

        expect(calls).toHaveLength(1);

        const lastCall = calls[0];
        const {args} = lastCall;

        expect(args).toHaveLength(2);

        const [endpoint, lastRequest] = lastCall.args as [
            string,
            {headers: Record<string, string>, body: string, keepalive: boolean},
        ];

        expect(endpoint).toBe(endpointUrl);

        expect(lastRequest.keepalive).toBeTrue();

        const {timestamp: originalTime, token, ...expectedBeacon} = beacon;

        expect(lastRequest.headers).toEqual({
            'X-Client-Id': clientId,
            'X-Token': token,
            'X-App-Id': appId,
            'X-Client-Library': CLIENT_LIBRARY,
            'Content-Type': 'application/json',
        });

        expect(JSON.parse(lastRequest.body)).toEqual({
            ...expectedBeacon,
            originalTime: originalTime,
            departureTime: 2,
        });
    });

    it('should not send the token header if the token is not provided', async () => {
        fetchMock.mockGlobal().route(endpointUrl, 200);

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
        });

        jest.useFakeTimers({now: 2});

        const beacon: Beacon = {
            context: {
                tabId: tabId,
                url: 'http://example.com',
            },
            payload: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
            timestamp: 1,
        };

        const promise = channel.publish({
            id: 'receipt-id',
            message: JSON.stringify(beacon),
        });

        await expect(promise).resolves.toBeUndefined();

        const calls = fetchMock.callHistory.calls();

        expect(calls).toHaveLength(1);

        const lastCall = calls[0];
        const {args} = lastCall;

        expect(args).toHaveLength(2);

        const [, lastRequest] = lastCall.args as [string, {headers: Record<string, string>, body: string}];

        expect(lastRequest).toBeDefined();

        expect(lastRequest.headers).not.toContainKey('X-Token');
    });

    it('should reject the promise if the response status is not OK', async () => {
        fetchMock.mockGlobal().route(endpointUrl, 500);

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
            logger: logger,
        });

        const listener = jest.fn();

        channel.subscribe(listener);

        const promise = channel.publish({
            id: 'receipt-id',
            message: JSON.stringify({
                context: {
                    tabId: tabId,
                    url: 'http://example.com',
                },
                payload: {
                    type: 'nothingChanged',
                    sinceTime: 0,
                },
                timestamp: 1,
            }),
        });

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Internal Server Error');
        await expect(promise).rejects.toHaveProperty('retryable', true);

        expect(listener).not.toHaveBeenCalled();

        expect(logger.error).toHaveBeenCalledWith('Failed to publish beacon: Internal Server Error');
    });

    it('should report a non-retryable error if a client error response is not valid JSON', async () => {
        fetchMock.mockGlobal().route(endpointUrl, {
            status: 400,
            body: 'Not JSON',
        });

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
            logger: logger,
        });

        const promise = channel.publish({
            id: 'receipt-id',
            message: JSON.stringify({
                context: {
                    tabId: tabId,
                    url: 'http://example.com',
                },
                payload: {
                    type: 'nothingChanged',
                    sinceTime: 0,
                },
                timestamp: 1,
            }),
        });

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Bad Request');
        await expect(promise).rejects.toHaveProperty('retryable', false);

        expect(logger.error).toHaveBeenCalledWith('Beacon rejected with non-retryable status: Bad Request');
    });

    it('should report a retryable error if publishing fails unexpectedly', async () => {
        const publisher = createPublisher();

        jest.spyOn(publisher, 'publish').mockRejectedValue(new Error('Unexpected error'));

        const channel = new HttpBeaconChannel({
            publisher: publisher,
            cidAssigner: cidAssigner,
            logger: logger,
        });

        const listener = jest.fn();

        channel.subscribe(listener);

        const promise = channel.publish({
            id: 'receipt-id',
            message: JSON.stringify({
                context: {
                    tabId: tabId,
                    url: 'http://example.com',
                },
                payload: {
                    type: 'nothingChanged',
                    sinceTime: 0,
                },
                timestamp: 1,
            }),
        });

        await expect(promise).rejects.toThrow(MessageDeliveryError);
        await expect(promise).rejects.toHaveProperty('retryable', true);

        expect(listener).not.toHaveBeenCalled();

        expect(logger.error).toHaveBeenCalledWith('Failed to publish beacon: Unexpected error');
    });

    type NonRetryableErrorScenario = {
        status: number,
        type?: string,
        title: string,
        log?: string,
    };

    it.each<NonRetryableErrorScenario>([
        {
            status: 400,
            title: 'Invalid token',
            log: 'Beacon rejected with non-retryable status: Invalid token',
        },
        {
            status: 401,
            title: 'Unauthorized request',
        },
        {
            status: 402,
            title: 'Payment overdue',
            log: 'Beacon rejected with non-retryable status: Payment overdue',
        },
        {
            status: 403,
            type: 'https://croct.help/api/authentication/quota-exceeded',
            title: 'Quota exceeded',
        },
        {
            status: 403,
            type: 'https://croct.help/api/authentication/forbidden-origin',
            title: 'Unallowed origin',
        },
    ])('should report a non-retryable error if the response status is $status', async scenario => {
        const {status, title} = scenario;
        const type = scenario.type ?? 'https://croct.help/api/event-tracker#error';
        const log = scenario.log ?? Help.forApiProblem({status: status, type: type, title: title});

        expect(log).toBeDefined();

        fetchMock.mockGlobal().route(endpointUrl, {
            status: status,
            body: JSON.stringify({
                type: type,
                title: title,
                status: status,
            }),
        });

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
            logger: logger,
        });

        const listener = jest.fn();

        channel.subscribe(listener);

        const receiptId = 'receipt-id';

        const promise = channel.publish({
            id: receiptId,
            message: JSON.stringify({
                context: {
                    tabId: tabId,
                    url: 'http://example.com',
                },
                payload: {
                    type: 'nothingChanged',
                    sinceTime: 0,
                },
                timestamp: 1,
            }),
        });

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, title);
        await expect(promise).rejects.toHaveProperty('retryable', false);

        expect(listener).not.toHaveBeenCalled();

        expect(logger.error).toHaveBeenCalledWith(log);
        expect(logger.error).toHaveBeenCalledWith(`Failed to publish beacon: ${title}`);
    });

    it.each([
        [429, 'Rate limit exceeded'],
        [408, 'Request timeout'],
        [503, 'Service unavailable'],
        [504, 'Gateway timeout'],
    ])('should report a retryable error if the response status is %i', async (status, title) => {
        fetchMock.mockGlobal().route(endpointUrl, {
            status: status,
            body: JSON.stringify({
                type: 'https://croct.help/api/event-tracker#error',
                title: title,
                status: status,
            }),
        });

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
            logger: logger,
        });

        const listener = jest.fn();

        channel.subscribe(listener);

        const receiptId = 'receipt-id';

        const promise = channel.publish({
            id: receiptId,
            message: JSON.stringify({
                context: {
                    tabId: tabId,
                    url: 'http://example.com',
                },
                payload: {
                    type: 'nothingChanged',
                    sinceTime: 0,
                },
                timestamp: 1,
            }),
        });

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, title);
        await expect(promise).rejects.toHaveProperty('retryable', true);

        expect(listener).not.toHaveBeenCalled();
    });

    it('should log a warning if the response status is 202', async () => {
        fetchMock.mockGlobal().route(endpointUrl, {
            status: 202,
            body: '',
        });

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
            logger: logger,
        });

        const listener = jest.fn();

        channel.subscribe(listener);

        const receiptId = 'receipt-id';

        const promise = channel.publish({
            id: receiptId,
            message: JSON.stringify({
                context: {
                    tabId: tabId,
                    url: 'http://example.com',
                },
                payload: {
                    type: 'nothingChanged',
                    sinceTime: 0,
                },
                timestamp: 1,
            }),
        });

        await expect(promise).resolves.toBeUndefined();

        expect(logger.warn).toHaveBeenCalledWith(Help.forStatusCode(202));

        expect(listener).toHaveBeenCalledWith(receiptId);
    });

    it('should not notify listeners that have been unsubscribed', async () => {
        fetchMock.mockGlobal().route(endpointUrl, 200);

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
        });

        const beacon: Beacon = {
            context: {
                tabId: tabId,
                url: 'http://example.com',
            },
            payload: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
            timestamp: 1,
        };

        const listener = jest.fn();

        channel.subscribe(listener);

        channel.unsubscribe(listener);

        const promise = channel.publish({
            id: 'receipt-id',
            message: JSON.stringify(beacon),
        });

        await expect(promise).resolves.toBeUndefined();

        expect(listener).not.toHaveBeenCalled();
    });

    it('should notify a listener subscribed multiple times only once', async () => {
        fetchMock.mockGlobal().route(endpointUrl, 200);

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
        });

        const listener = jest.fn();

        channel.subscribe(listener);
        channel.subscribe(listener);

        const receiptId = 'receipt-id';

        const promise = channel.publish({
            id: receiptId,
            message: JSON.stringify({
                context: {
                    tabId: tabId,
                    url: 'http://example.com',
                },
                payload: {
                    type: 'nothingChanged',
                    sinceTime: 0,
                },
                timestamp: 1,
            }),
        });

        await expect(promise).resolves.toBeUndefined();

        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith(receiptId);
    });

    it('should ignore unsubscribing a listener that is not subscribed', async () => {
        fetchMock.mockGlobal().route(endpointUrl, 200);

        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
        });

        const subscribedListener = jest.fn();
        const unsubscribedListener = jest.fn();

        channel.subscribe(subscribedListener);
        channel.unsubscribe(unsubscribedListener);

        const receiptId = 'receipt-id';

        const promise = channel.publish({
            id: receiptId,
            message: JSON.stringify({
                context: {
                    tabId: tabId,
                    url: 'http://example.com',
                },
                payload: {
                    type: 'nothingChanged',
                    sinceTime: 0,
                },
                timestamp: 1,
            }),
        });

        await expect(promise).resolves.toBeUndefined();

        expect(subscribedListener).toHaveBeenCalledWith(receiptId);
        expect(unsubscribedListener).not.toHaveBeenCalled();
    });

    it('should close the channel', async () => {
        const channel = new HttpBeaconChannel({
            publisher: createPublisher(),
            cidAssigner: cidAssigner,
        });

        const beacon: Beacon = {
            context: {
                tabId: tabId,
                url: 'http://example.com',
            },
            payload: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
            timestamp: 1,
        };

        const listener = jest.fn();

        channel.subscribe(listener);

        channel.close();

        const promise = channel.publish({
            id: 'receipt-id',
            message: JSON.stringify(beacon),
        });

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Channel is closed');
        await expect(promise).rejects.toHaveProperty('retryable', false);

        expect(fetchMock.callHistory.calls()).toHaveLength(0);
    });
});
