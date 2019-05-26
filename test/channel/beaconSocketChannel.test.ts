import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import SandboxChannel from '../../src/channel/sandboxChannel';
import BeaconSocketChannel from '../../src/channel/beaconSocketChannel';
import {DuplexChannel} from '../../src/channel';
import {Envelope} from '../../src/channel/guaranteedChannel';
import {Beacon, BeaconPayload, EventContext} from '../../src/event';

describe('A beacon socket channel', () => {
    const bootstrapRequestMatcher: MockOptions = {
        method: 'HEAD',
        matcher: 'https://localhost:8080/boostrap',
        response: '',
    };

    afterEach(() => {
        fetchMock.reset();
        jest.restoreAllMocks();
    });

    const context: EventContext = {
        tabId: '123',
        url: 'https://localhost',
        metadata: {
            foo: 'bar',
        },
    };

    const payload: BeaconPayload = {
        type: 'nothingChanged',
        sinceTime: 0,
    };

    test('should publish messages on the output channel', async () => {
        const date = jest.spyOn(Date, 'now');
        const now = Date.now();
        date.mockReturnValue(now);

        const socketChannel = new SandboxChannel<string, string>();
        const channel = new BeaconSocketChannel({
            channelFactory: (): SandboxChannel<string, string> => socketChannel,
            tokenParameter: 'token-parameter',
            trackerEndpointUrl: 'ws://localhost:8080',
            bootstrapEndpointUrl: 'https://localhost:8080/boostrap',
        });

        const beacon: Beacon = {
            timestamp: 123456789,
            context: context,
            payload: payload,
        };

        const message: Envelope<string, string> = {
            id: '123',
            message: JSON.stringify(beacon),
        };

        fetchMock.mock(bootstrapRequestMatcher);

        await channel.publish(message);

        expect(socketChannel.messages).toHaveLength(1);

        const [publishedMessage] = socketChannel.messages;
        const expectedMessage = {
            receiptId: '123',
            originalTime: 123456789,
            departureTime: now,
            context: context,
            payload: payload,
        };

        expect(JSON.parse(publishedMessage)).toStrictEqual(expectedMessage);
    });

    test('should establish a new connection when the token changes', async () => {
        const date = jest.spyOn(Date, 'now');
        const now = Date.now();
        date.mockReturnValue(now);

        const firstSocketChannel = new SandboxChannel<string, string>();
        const secondSocketChannel = new SandboxChannel<string, string>();
        const channel = new BeaconSocketChannel({
            channelFactory: jest.fn()
                .mockReturnValueOnce(firstSocketChannel)
                .mockReturnValueOnce(secondSocketChannel),
            tokenParameter: 'token-parameter',
            trackerEndpointUrl: 'ws://localhost:8080',
            bootstrapEndpointUrl: 'https://localhost:8080/boostrap',
        });

        const firstBeacon: Beacon = {
            timestamp: 123456789,
            context: context,
            payload: payload,
        };

        const firstMessage: Envelope<string, string> = {
            id: '123',
            message: JSON.stringify(firstBeacon),
        };

        fetchMock.mock(bootstrapRequestMatcher);

        await channel.publish(firstMessage);

        expect(firstSocketChannel.messages).toHaveLength(1);

        const [firstPublishedMessage] = firstSocketChannel.messages;
        const firstExpectedMessage = {
            receiptId: '123',
            originalTime: 123456789,
            departureTime: now,
            payload: payload,
            context: context,
        };

        expect(JSON.parse(firstPublishedMessage)).toStrictEqual(firstExpectedMessage);

        const secondBeacon: Beacon = {
            token: 'some-token',
            timestamp: 234567890,
            context: context,
            payload: payload,
        };

        const secondMessage: Envelope<string, string> = {
            id: '456',
            message: JSON.stringify(secondBeacon),
        };

        await channel.publish(secondMessage);

        expect(secondSocketChannel.messages).toHaveLength(1);

        const [secondPublishedMessage] = secondSocketChannel.messages;
        const secondExpectedMessage = {
            receiptId: '456',
            departureTime: now,
            originalTime: 234567890,
            context: context,
            payload: payload,
        };

        expect(JSON.parse(secondPublishedMessage)).toStrictEqual(secondExpectedMessage);
    });

    test('should fail if an error occurs while closing the current connection', async () => {
        const date = jest.spyOn(Date, 'now');
        const now = Date.now();
        date.mockReturnValue(now);

        const error = new Error('Error while closing.');
        const publish = jest.fn();
        const duplexChannel: DuplexChannel<string, string> = {
            close: jest.fn().mockRejectedValue(error),
            publish: publish,
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
        };
        const channel = new BeaconSocketChannel({
            channelFactory: (): DuplexChannel<string, string> => duplexChannel,
            tokenParameter: 'token-parameter',
            trackerEndpointUrl: 'ws://localhost:8080',
            bootstrapEndpointUrl: 'https://localhost:8080/boostrap',
        });

        const firstBeacon: Beacon = {
            timestamp: 123456789,
            context: context,
            payload: payload,
        };

        const firstMessage: Envelope<string, string> = {
            id: '123',
            message: JSON.stringify(firstBeacon),
        };

        fetchMock.mock(bootstrapRequestMatcher);

        await channel.publish(firstMessage);

        expect(publish).toHaveBeenCalled();

        expect(JSON.parse(publish.mock.calls[0][0])).toStrictEqual({
            receiptId: '123',
            originalTime: 123456789,
            departureTime: now,
            context: context,
            payload: payload,
        });

        const secondBeacon: Beacon = {
            token: 'some-token',
            timestamp: 234567890,
            context: context,
            payload: payload,
        };

        const secondMessage: Envelope<string, string> = {
            id: '456',
            message: JSON.stringify(secondBeacon),
        };

        await expect(channel.publish(secondMessage)).rejects.toThrow(error);
    });

    test('should fail if an unexpected error occurs during the bootstrap', async () => {
        const duplexChannel: DuplexChannel<string, string> = {
            close: jest.fn(),
            publish: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
        };
        const channel = new BeaconSocketChannel({
            channelFactory: (): DuplexChannel<string, string> => duplexChannel,
            tokenParameter: 'token-parameter',
            trackerEndpointUrl: 'ws://localhost:8080',
            bootstrapEndpointUrl: 'https://localhost:8080/boostrap',
        });

        fetchMock.mock({
            ...bootstrapRequestMatcher,
            response: 503,
        });

        const beacon: Beacon = {
            token: 'some-token',
            timestamp: 234567890,
            context: context,
            payload: payload,
        };

        const message: Envelope<string, string> = {
            id: '456',
            message: JSON.stringify(beacon),
        };

        await expect(channel.publish(message))
            .rejects
            .toThrow('Unexpected error during bootstrap: service Unavailable');
    });

    test('should allow subscribing and unsubscribing listeners', async () => {
        const socketChannel = new SandboxChannel<string, string>();
        const listener = jest.fn();
        const channel = new BeaconSocketChannel({
            channelFactory: (): SandboxChannel<string, string> => socketChannel,
            tokenParameter: 'token-parameter',
            trackerEndpointUrl: 'ws://localhost:8080',
            bootstrapEndpointUrl: 'https://localhost:8080/boostrap',
        });

        channel.subscribe(listener);

        const beacon: Beacon = {
            timestamp: 123456789,
            context: context,
            payload: payload,
        };

        const message: Envelope<string, string> = {
            id: '123',
            message: JSON.stringify(beacon),
        };

        fetchMock.mock(bootstrapRequestMatcher);

        await channel.publish(message);

        socketChannel.notify(JSON.stringify({receiptId: '123'}));

        expect(listener).toHaveBeenNthCalledWith(1, '123');

        channel.unsubscribe(listener);

        socketChannel.notify(JSON.stringify('123'));

        expect(listener).toHaveBeenCalledTimes(1);
    });

    test('should not notify listeners about invalid messages', async () => {
        const socketChannel = new SandboxChannel<string, string>();
        const listener = jest.fn();
        const channel = new BeaconSocketChannel({
            channelFactory: (): SandboxChannel<string, string> => socketChannel,
            tokenParameter: 'token-parameter',
            trackerEndpointUrl: 'ws://localhost:8080',
            bootstrapEndpointUrl: 'https://localhost:8080/boostrap',
        });

        channel.subscribe(listener);

        const beacon: Beacon = {
            timestamp: 123456789,
            context: context,
            payload: payload,
        };

        const message: Envelope<string, string> = {
            id: '123',
            message: JSON.stringify(beacon),
        };

        fetchMock.mock(bootstrapRequestMatcher);

        await channel.publish(message);

        socketChannel.notify('invalid-json');

        expect(listener).not.toHaveBeenCalled();
    });

    test('should be able to be closed even if never used', async () => {
        const socketChannel = new SandboxChannel<string, string>();
        const channel = new BeaconSocketChannel({
            channelFactory: (): SandboxChannel<string, string> => socketChannel,
            tokenParameter: 'token-parameter',
            trackerEndpointUrl: 'ws://localhost:8080',
            bootstrapEndpointUrl: 'https://localhost:8080/boostrap',
        });

        await expect(channel.close()).resolves.toBeUndefined();
    });

    test('should close the socket channel on close', async () => {
        const socketChannel = new SandboxChannel<string, string>();
        const channel = new BeaconSocketChannel({
            channelFactory: (): SandboxChannel<string, string> => socketChannel,
            tokenParameter: 'token-parameter',
            trackerEndpointUrl: 'ws://localhost:8080',
            bootstrapEndpointUrl: 'https://localhost:8080/boostrap',
        });

        const beacon: Beacon = {
            timestamp: 123456789,
            context: context,
            payload: payload,
        };

        const message: Envelope<string, string> = {
            id: '123',
            message: JSON.stringify(beacon),
        };

        fetchMock.mock(bootstrapRequestMatcher);

        await channel.publish(message).then(() => channel.close());

        expect(socketChannel.isClosed()).toBeTruthy();
    });
});
