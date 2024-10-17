import {InMemoryQueue, CapacityRestrictedQueue} from '../../src/queue';
import {QueuedChannel, OutputChannel, MessageDeliveryError} from '../../src/channel';
import {Logger} from '../../src/logging';

describe('A queued channel', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should resume flushing from the oldest message', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new MessageDeliveryError('Rejected', true))
                .mockResolvedValue(undefined),
        };
        const queue = new InMemoryQueue('foo', 'bar');
        const channel = new QueuedChannel(outputChannel, queue);

        await expect(channel.flush()).rejects.toThrowWithMessage(MessageDeliveryError, 'Rejected');

        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');

        expect(outputChannel.publish).toHaveBeenCalledTimes(2);
        expect(queue.isEmpty()).toBe(false);
        expect(queue.peek()).toBe('bar');

        await channel.flush();

        expect(outputChannel.publish).toHaveBeenCalledTimes(3);
        expect(queue.isEmpty()).toBe(true);

        await expect(channel.publish('baz')).resolves.toBeUndefined();

        expect(outputChannel.publish).toHaveBeenNthCalledWith(4, 'baz');

        expect(outputChannel.publish).toHaveBeenCalledTimes(4);
        expect(queue.isEmpty()).toBe(true);
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

        const promise = channel.flush();

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Channel is closed.');
        await expect(promise).rejects.toHaveProperty('retryable', false);
    });

    it('should fail to publish messages if the queue is full', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new CapacityRestrictedQueue(new InMemoryQueue('foo'), 1));

        const promise = channel.publish('bar');

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'The queue is full.');
        await expect(promise).rejects.toHaveProperty('retryable', true);
    });

    it('should fail to publish messages if the channel is closed', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new QueuedChannel(outputChannel, new InMemoryQueue());

        await channel.close();

        const promise = channel.publish('foo');

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Channel is closed.');
        await expect(promise).rejects.toHaveProperty('retryable', false);
    });

    it('should automatically requeue messages on the first publish', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };

        const queue = new InMemoryQueue('foo', 'bar');
        const channel = new QueuedChannel(outputChannel, queue);

        await expect(channel.publish('baz')).resolves.toBeUndefined();

        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(3, 'baz');

        expect(queue.isEmpty()).toBe(true);

        await channel.publish('qux');

        expect(outputChannel.publish).toHaveBeenNthCalledWith(4, 'qux');
        expect(outputChannel.publish).toHaveBeenCalledTimes(4);
    });

    it('should publish messages immediately if queue has no pending messages', async () => {
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

    it('should require a flush after a failed, non-retryable message', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockImplementationOnce(
                    () => new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Failed')), 1);
                    }),
                )
                .mockResolvedValue(undefined),
        };

        const channel = new QueuedChannel(outputChannel, new InMemoryQueue(), logger);

        await expect(channel.publish('foo')).rejects.toEqual(expect.any(Error));
        await expect(channel.publish('bar')).rejects.toEqual(expect.any(Error));

        expect(outputChannel.publish).toHaveBeenCalledTimes(1);
        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');

        await channel.flush();

        expect(outputChannel.publish).toHaveBeenCalledTimes(2);
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');
    });

    it('should not require flush for processing re-enqueued messages', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockRejectedValueOnce(new Error('Failed'))
                .mockRejectedValueOnce(new Error('Failed'))
                .mockResolvedValue(undefined),
        };

        const queue = new InMemoryQueue('foo', 'bar');
        const channel = new QueuedChannel(outputChannel, queue);

        await expect(channel.publish('baz')).resolves.toBeUndefined();

        expect(outputChannel.publish).toHaveBeenCalledTimes(3);
        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(3, 'baz');

        expect(queue.isEmpty()).toBe(true);
    });

    it('should flush all non-retryable messages even if an error occurs', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockRejectedValueOnce(new Error('Failed'))
                .mockRejectedValueOnce(new Error('Failed')),
        };

        const queue = new InMemoryQueue('foo', 'bar');
        const channel = new QueuedChannel(outputChannel, queue);

        await expect(channel.flush()).resolves.toBeUndefined();

        expect(outputChannel.publish).toHaveBeenCalledTimes(2);
        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');

        expect(queue.isEmpty()).toBe(true);
    });

    it('should not dequeue messages if an retryable error occurs', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new MessageDeliveryError('Rejected', true))
                .mockResolvedValueOnce(undefined),
        };

        const queue = new InMemoryQueue('foo');
        const channel = new QueuedChannel(outputChannel, queue);

        const promise = channel.publish('bar');

        await expect(promise).rejects.toEqual(expect.any(MessageDeliveryError));

        expect(outputChannel.publish).toHaveBeenCalledTimes(2);
        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');

        expect(queue.length()).toBe(1);
        expect(queue.peek()).toBe('bar');

        await expect(channel.flush()).resolves.toBeUndefined();

        expect(outputChannel.publish).toHaveBeenCalledTimes(3);
        expect(outputChannel.publish).toHaveBeenNthCalledWith(3, 'bar');

        expect(queue.isEmpty()).toBe(true);
    });

    it('should requeue messages if a retryable error occurs', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new MessageDeliveryError('Rejected', true))
                .mockResolvedValue(undefined),
        };

        const queue = new InMemoryQueue('foo');
        const channel = new QueuedChannel(outputChannel, queue);

        await expect(channel.publish('bar')).rejects.toEqual(expect.any(MessageDeliveryError));

        expect(outputChannel.publish).toHaveBeenCalledTimes(2);
        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'bar');

        expect(queue.length()).toBe(1);
        expect(queue.peek()).toBe('bar');

        await expect(channel.publish('baz')).resolves.toBeUndefined();

        expect(outputChannel.publish).toHaveBeenCalledTimes(4);
        expect(outputChannel.publish).toHaveBeenNthCalledWith(3, 'bar');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(4, 'baz');

        expect(queue.isEmpty()).toBe(true);
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
