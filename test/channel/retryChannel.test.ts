import RetryChannel from '../../src/channel/retryChannel';
import {OutputChannel} from '../../src/channel';
import MaxAttemptsPolicy from '../../src/retryPolicy/maxAttemptsPolicy';

describe('A retry channel', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should not retry if a message is successfully published', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 2),
        });

        await channel.publish('ping');

        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'ping');
        expect(outputChannel.publish).toHaveBeenCalledTimes(1);
    });

    test('should retry if an error occurs while publishing a message', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockRejectedValueOnce(new Error('Rejected'))
                .mockRejectedValueOnce(new Error('Rejected'))
                .mockResolvedValue(undefined),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(1, 3),
        });

        await channel.publish('ping');

        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'ping');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'ping');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(3, 'ping');
        expect(outputChannel.publish).toHaveBeenCalledTimes(3);
    });

    test('should fail to publish messages if the channel is closed', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        await channel.close();

        await expect(channel.publish('foo')).rejects.toEqual(new Error('The channel is closed.'));
    });

    test('should fail to publish a message if the channel is closed before retrying', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockRejectedValue(new Error('Rejected')),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        const promise = channel.publish('foo');

        await channel.close();

        await expect(promise).rejects.toEqual(new Error('Connection deliberately closed.'));
    });

    test('should fail to publish a message if the channel is closed while retrying', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockRejectedValue(new Error('Rejected')),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(60000, 1),
        });

        const promise = channel.publish('foo');

        await new Promise(resolve => window.setTimeout(resolve, 10));

        await channel.close();

        await expect(promise).rejects.toEqual(new Error('Connection deliberately closed.'));
    });

    test('should fail to publish a message if maximum retry attempts is reached', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockRejectedValueOnce(new Error('Rejected'))
                .mockRejectedValueOnce(new Error('Rejected')),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        await expect(channel.publish('foo')).rejects.toEqual(new Error('Maximum retry attempts reached.'));
        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'foo');
        expect(outputChannel.publish).toHaveBeenCalledTimes(2);
    });

    test('should close the output channel on close', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn(),
            publish: jest.fn(),
        };

        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        await channel.close();

        expect(outputChannel.close).toBeCalled();
    });
});
