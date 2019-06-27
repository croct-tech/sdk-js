import WS from 'jest-websocket-mock';
import {SocketChannel} from '../../src/channel/socketChannel';
import {MaxAttemptsPolicy} from "../../src/retryPolicy/maxAttemptsPolicy";

afterEach(WS.clean);

test('should close the connection', async () => {
    const server = new WS('ws://localhost:8080');

    const channel = new SocketChannel({url: 'ws://localhost:8080'});

    const connection = await server.connected;

    expect(connection.readyState).toBe(WebSocket.OPEN);

    await channel.close();

    expect(connection.readyState).toBe(WebSocket.CLOSED);
});

test('should retry connection 3 times', async () => {
    const retryPolicy = new MaxAttemptsPolicy(0, 3);
    const shouldRetry = jest.spyOn(retryPolicy, 'shouldRetry');

    const channel = new SocketChannel({
        url: 'ws://localhost:8080',
        retryPolicy: retryPolicy
    });

    await expect(channel.connected).resolves.toBe(false);

    expect(shouldRetry).toBeCalledTimes(4);

    expect(shouldRetry).toHaveBeenNthCalledWith(1, 0, undefined);
    expect(shouldRetry).toHaveNthReturnedWith(1, true);

    expect(shouldRetry).toHaveBeenNthCalledWith(2, 1, undefined);
    expect(shouldRetry).toHaveNthReturnedWith(2, true);

    expect(shouldRetry).toHaveBeenNthCalledWith(3, 2, undefined);
    expect(shouldRetry).toHaveNthReturnedWith(3, true);

    expect(shouldRetry).toHaveBeenNthCalledWith(4, 3, undefined);
    expect(shouldRetry).toHaveNthReturnedWith(4, false);
});

test('should send more data only if no data buffered', async () => {
    const server = new WS('ws://localhost:8080');
    const channel = new SocketChannel({url: 'ws://localhost:8080'});

    const connection = await server.connected;

    const bufferedAmount = jest.fn()
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(0);

    Object.defineProperty(connection, 'bufferedAmount', {
        get: bufferedAmount,
    });

    const promise = channel.publish('ping');

    expect(server).toHaveReceivedMessages([]);

    await expect(promise).resolves.toBeUndefined();

    expect(bufferedAmount).toBeCalledTimes(3);

    expect(server).toHaveReceivedMessages(['ping']);
});

test('should fail if an error occurs while sending data', async () => {
    const server = new WS('ws://localhost:8080');
    const channel = new SocketChannel({url: 'ws://localhost:8080'});

    const connection = await server.connected;

    const bufferedAmount = jest.fn().mockReturnValue(100);

    Object.defineProperty(connection, 'bufferedAmount', {
        get: bufferedAmount,
    });

    const promise = channel.publish('ping');

    await expect(server).toReceiveMessage('ping');

    server.error();

    await expect(promise).rejects.toBeUndefined();
});


test('should delivery published messages', async () => {
    const server = new WS('ws://localhost:8080');

    const channel = new SocketChannel({url: 'ws://localhost:8080'});

    await expect(channel.connected).resolves.toBe(true);

    const promise = channel.publish('ping');

    await expect(promise).resolves.toBeUndefined();

    expect(server).toReceiveMessage('ping');
});

test('should notify listeners about received messages', async () => {
    const server = new WS('ws://localhost:8080');

    const channel = new SocketChannel({url: 'ws://localhost:8080'});

    await expect(channel.connected).resolves.toBe(true);

    const listener = jest.fn();

    channel.subscribe(listener);

    expect(listener).not.toHaveBeenCalled();

    server.send('pong');

    expect(listener).toHaveBeenCalledWith('pong');
});

test('should delivery messages in order', async () => {
    const server = new WS('ws://localhost:8080');
    const channel = new SocketChannel({url: 'ws://localhost:8080'});

    const connection = await server.connected;

    const bufferedAmount = jest.fn()
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(10)
        .mockReturnValue(0);

    Object.defineProperty(connection, 'bufferedAmount', {
        get: bufferedAmount,
    });

    const first = channel.publish('first ping');
    const second = channel.publish('second ping');

    expect(server).toHaveReceivedMessages([]);

    await expect(first).resolves.toBeUndefined();

    expect(bufferedAmount).toBeCalledTimes(2);

    expect(server).toHaveReceivedMessages(['first ping']);

    await expect(second).resolves.toBeUndefined();

    expect(bufferedAmount).toBeCalledTimes(4);

    expect(server).toHaveReceivedMessages(['first ping', 'second ping']);
});

// https://github.com/romgain/jest-websocket-mock/issues/15
/*test('should keep delivering messages after a failure', async () => {
    let server = new WS('ws://localhost:8080');

    const channel = new SocketChannel({
        url: 'ws://localhost:8080',
        retryPolicy: new MaxAttemptsPolicy(500, 1),
        logger: new ConsoleLogger()
    });

    const connection = await server.connected;

    const bufferedAmount = jest.fn()
        .mockReturnValue(10);

    Object.defineProperty(connection, 'bufferedAmount', {
        get: bufferedAmount,
    });

    const first = channel.publish('first ping');
    const second = channel.publish('second ping');

    await object(server).toReceiveMessage('first ping');

    server.error();

    await object(first).rejects.toBeUndefined();

    await object(server).toReceiveMessage('second ping');

    await object(second).resolves.toBeUndefined();

});
*/