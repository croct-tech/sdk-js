import {InMemoryQueue, CapacityRestrictedQueue} from '../../src/queue';
import {QueuedChannel, OutputChannel} from '../../src/channel';

describe('A queued channel', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should resume flushing from the last failed message', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Rejected'))
                .mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new InMemoryQueue('foo', 'bar'));

        await expect(channel.flush()).rejects.toEqual(expect.any(Error));
        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');

        await channel.flush();

        expect(outputChannel.publish).toHaveBeenNthCalledWith(3, 'bar');

        await channel.flush();

        expect(outputChannel.publish).toHaveBeenNthCalledWith(3, 'bar');

        expect(outputChannel.publish).toHaveBeenCalledTimes(3);
    });

    it('should do nothing when flushing an empty queue', async () => {
        const queue = new InMemoryQueue('foo');
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, queue);

        queue.shift();

        await channel.flush();

        expect(outputChannel.publish).not.toHaveBeenCalled();
    });

    it('should publish messages in order', async () => {
        const pending: Array<{(): void}> = [];

        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn(() => new Promise(resolve => { pending.push(resolve); })),
        };
        const channel = new QueuedChannel(outputChannel, new InMemoryQueue());

        const firstPromise = channel.publish('foo');
        const secondPromise = channel.publish('bar');

        // Wait a few milliseconds to ensure that both messages
        // would have been delivered if they were not correctly queued
        await new Promise(resolve => { window.setTimeout(resolve, 30); });

        expect(outputChannel.publish).toHaveBeenCalledWith('foo');
        expect(outputChannel.publish).not.toHaveBeenCalledWith('bar');

        expect(pending).toHaveLength(1);

        pending[0]();

        await expect(firstPromise).resolves.toBeUndefined();

        expect(outputChannel.publish).toHaveBeenCalledWith('bar');

        expect(pending).toHaveLength(2);

        pending[1]();

        await expect(secondPromise).resolves.toBeUndefined();
    });

    it('should fail to flush messages if the channel is closed', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new InMemoryQueue('foo'));

        await channel.close();

        await expect(channel.flush()).rejects.toEqual(new Error('Channel is closed.'));
    });

    it('should fail to publish messages if the queue is full', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new CapacityRestrictedQueue(new InMemoryQueue('foo'), 1));

        await expect(channel.publish('bar')).rejects.toThrow('The queue is full.');
    });

    it('should fail to publish messages if the channel is closed', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new InMemoryQueue());

        await channel.close();

        await expect(channel.publish('foo')).rejects.toEqual(new Error('Channel is closed.'));
    });

    it('should fail to publish messages if queue has pending messages', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new InMemoryQueue('foo'));

        await expect(channel.publish('bar')).rejects.toEqual(expect.any(Error));

        await channel.flush();

        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');

        await channel.publish('baz');

        expect(outputChannel.publish).toHaveBeenNthCalledWith(3, 'baz');
        expect(outputChannel.publish).toHaveBeenCalledTimes(3);
    });

    it('should publish messages if queue has no pending messages', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new InMemoryQueue());

        await channel.publish('foo');

        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');

        await channel.flush();

        await channel.publish('bar');

        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');

        expect(outputChannel.publish).toHaveBeenCalledTimes(2);
    });

    it('should close the output channel and wait for pending messages', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new InMemoryQueue('foo'));

        await expect(channel.flush()).resolves.toBeUndefined();

        await channel.close();

        expect(outputChannel.close).toHaveBeenCalled();
    });
});
