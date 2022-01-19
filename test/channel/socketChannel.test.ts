import {WS} from 'jest-websocket-mock';
import {SocketChannel} from '../../src/channel';
import {Logger} from '../../src/logging';

describe('A socket channel', () => {
    const url = 'ws://localhost:8080';

    afterEach(() => {
        WS.clean();
        jest.restoreAllMocks();
    });

    test('should publish messages in order', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url});

        await channel.publish('foo');
        await expect(server).toReceiveMessage('foo');

        await channel.publish('bar');
        await expect(server).toReceiveMessage('bar');

        expect(server).toHaveReceivedMessages(['foo', 'bar']);
    });

    test('should fail to publish messages if the connection is closed', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url});

        await channel.publish('open connection');
        await server.connected;

        await channel.close();

        await expect(channel.publish('bar')).rejects.toThrow('Channel has been closed.');
    });

    test('should fail to publish messages if an error occurs in the meanwhile', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url});

        server.on('connection', socket => {
            socket.close({code: 1011, reason: 'Server error', wasClean: false});
        });

        await expect(channel.publish('foo')).rejects.toThrowError();
    });

    test('should reconnect if the connection cannot be established', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url});

        let attempt = 0;
        server.on('connection', socket => {
            if (attempt === 0) {
                socket.close({code: 1011, reason: 'Server error', wasClean: false});
            }

            attempt += 1;
        });

        await expect(channel.publish('foo')).rejects.toThrowError();
        await expect(channel.publish('bar')).resolves.toBeUndefined();
    });

    test('should reconnect when receiving a message after the connection is closed', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url});

        await expect(channel.publish('foo')).resolves.toBeUndefined();

        const connection = await server.connected;

        connection.close({
            code: 1011,
            reason: 'Server error',
            wasClean: true,
        });

        await server.closed;

        await expect(channel.publish('bar')).resolves.toBeUndefined();
    });

    test('should allow to subscribe and unsubscribe listeners', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url});
        const listener = jest.fn();

        channel.subscribe(listener);

        expect(listener).not.toHaveBeenCalled();

        await channel.publish('open connection');
        await server.connected;

        server.send('foo');

        expect(listener).toHaveBeenCalledWith('foo');

        channel.unsubscribe(listener);

        server.send('bar');

        expect(listener).not.toHaveBeenCalledWith('bar');
        expect(listener).toHaveBeenCalledTimes(1);
    });

    test('should determine whether it is connected to the server or not', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url});

        await expect(channel.connected).resolves.toBeFalsy();

        await channel.publish('open connection');
        const connection = await server.connected;

        expect(connection.readyState).toBe(WebSocket.OPEN);
        await expect(channel.connected).resolves.toBeTruthy();
    });

    test('should configure the connection to use binary data type', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url, binaryType: 'blob'});

        await expect(channel.connected).resolves.toBeFalsy();

        await channel.publish('open connection');
        const connection = await server.connected;

        expect(connection.binaryType).toBe('blob');
    });

    test('should allow to close the web socket connection', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url});

        await channel.publish('open connection');

        const connection = await server.connected;

        expect(connection.readyState).toBe(WebSocket.OPEN);

        await channel.close();

        expect(connection.readyState).toBe(WebSocket.CLOSED);
    });

    test('should be able to close the channel even before establishing a connection', async () => {
        const channel = new SocketChannel({url: url});

        await expect(channel.close()).resolves.toBeUndefined();
    });

    test('should close the web socket connection if timeout is reached', async () => {
        const close = jest.fn();

        window.WebSocket = class MockedSocket extends WebSocket {
            public constructor() {
                super('ws://foo');
            }

            public on(): void {
                // ignore
            }

            public addEventListener(): void {
                // ignore
            }

            public get onopen(): jest.Mock {
                return jest.fn();
            }

            public get onmessage(): jest.Mock {
                return jest.fn();
            }

            public get onclose(): jest.Mock {
                return jest.fn();
            }

            public get onerror(): jest.Mock {
                return jest.fn();
            }

            public close(code?: number, reason?: string): void {
                close(code, reason);
            }
        };

        const channel = new SocketChannel({url: url, connectionTimeout: 100});

        await expect(channel.publish('timeout')).rejects.toThrow('Maximum connection timeout reached.');

        expect(close).toHaveBeenCalledWith(1000, 'Maximum connection timeout reached.');
    });

    test('should abort closing the channel if the timeout is reached', async () => {
        const server = new WS(url);
        const channel = new SocketChannel({url: url, closeTimeout: 0});

        await channel.publish('open connection');
        await server.connected;

        await expect(channel.close()).rejects.toThrow('Maximum close timeout reached.');
    });

    test('should close connection with error', async () => {
        const channel = new SocketChannel({url: url});

        await expect(channel.publish('open connection')).rejects.toThrowError();

        await expect(channel.close()).resolves.toBeUndefined();
    });

    test('should close the connection if an error occurs', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
        };
        const server = new WS(url);
        const channel = new SocketChannel({url: url, logger: logger});

        server.error();

        await expect(channel.publish('foo')).rejects.toThrow('Connection has been closed, reason');
        await expect(logger.error).toHaveBeenCalledWith('Connection error.');
    });
});
