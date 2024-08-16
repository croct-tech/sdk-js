import * as fetchMock from 'fetch-mock';
import {HttpBeaconChannel} from '../../src/channel';
import {Logger} from '../../src/logging';
import {FixedAssigner} from '../../src/cid';
import {Beacon} from '../../src/trackingEvents';
import {Token} from '../../src/token';
import {CLIENT_LIBRARY} from '../../src/constants';

describe('An HTTP beacon channel', () => {
    beforeEach(() => {
        fetchMock.reset();
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useRealTimers();
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

    const endpointUrl = 'http://api.croct.io/web/client/track';

    it('should send a beacon to the specified URL', async () => {
        fetchMock.mock(endpointUrl, 200);

        const channel = new HttpBeaconChannel({
            appId: appId,
            endpointUrl: endpointUrl,
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

        const calls = fetchMock.calls();

        expect(calls).toHaveLength(1);

        const lastCall = calls[0] as fetchMock.MockCall;
        const lastRequest = lastCall[1] as fetchMock.MockRequest;

        expect(lastCall[0]).toBe(endpointUrl);

        const {timestamp: originalTime, token, ...expectedBeacon} = beacon;

        expect(lastRequest.headers).toEqual({
            'X-Client-Id': clientId,
            'X-Token': token,
            'X-App-Id': appId,
            'X-Client-Library': CLIENT_LIBRARY,
            'Content-Type': 'application/json',
        });

        expect(JSON.parse(lastRequest.body as string)).toEqual({
            ...expectedBeacon,
            originalTime: originalTime,
            departureTime: 2,
        });
    });

    it('should not send the token header if the token is not provided', async () => {
        fetchMock.mock(endpointUrl, 200);

        const channel = new HttpBeaconChannel({
            appId: appId,
            endpointUrl: endpointUrl,
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

        const lastRequest = fetchMock.lastCall(endpointUrl)?.[1] as fetchMock.MockRequest;

        expect(lastRequest).not.toBeUndefined();

        expect(lastRequest.headers).not.toContainKey('X-Token');
    });

    it('should reject the promise if the response status is not OK', async () => {
        fetchMock.mock(endpointUrl, 500);

        const channel = new HttpBeaconChannel({
            appId: appId,
            endpointUrl: endpointUrl,
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

        await expect(promise).rejects.toThrow('Internal Server Error');

        expect(listener).not.toHaveBeenCalled();

        expect(logger.error).toHaveBeenCalledWith('Failed to publish beacon: Internal Server Error');
    });

    it.each([
        [403, 'API usage limit exceeded'],
        [401, 'Invalid token'],
    ])('should log an error and resolve the promise if the response status is %i', async (status, title) => {
        fetchMock.mock(endpointUrl, {
            status: status,
            body: JSON.stringify({
                type: 'https://croct.help/api/event-tracker#error',
                title: title,
                status: status,
            }),
        });

        const channel = new HttpBeaconChannel({
            appId: appId,
            endpointUrl: endpointUrl,
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

        expect(listener).toHaveBeenCalledWith(receiptId);

        expect(logger.error).toHaveBeenCalledWith(`Beacon rejected with non-retryable status: ${title}`);
    });

    it('should not notify listeners that have been unsubscribed', async () => {
        fetchMock.mock(endpointUrl, 200);

        const channel = new HttpBeaconChannel({
            appId: appId,
            endpointUrl: endpointUrl,
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

    it('should close the channel', async () => {
        const channel = new HttpBeaconChannel({
            appId: appId,
            endpointUrl: endpointUrl,
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

        await expect(promise).rejects.toThrow('Channel is closed');

        expect(listener).not.toHaveBeenCalled();

        expect(fetchMock.calls()).toHaveLength(0);
    });
});
