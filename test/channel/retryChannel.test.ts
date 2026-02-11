import type {OutputChannel} from '../../src/channel';
import {RetryChannel, MessageDeliveryError} from '../../src/channel';
import {MaxAttemptsPolicy} from '../../src/retry';

describe('A retry channel', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should not retry if a message is successfully published', async () => {
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

    it('should retry if an error occurs while publishing a message', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockRejectedValueOnce(new MessageDeliveryError('Rejected', true))
                .mockRejectedValueOnce(new MessageDeliveryError('Rejected', true))
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

    it('should fail to publish messages if the channel is closed', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        await channel.close();

        const promise = channel.publish('foo');

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'The channel is closed.');
        await expect(promise).rejects.toHaveProperty('retryable', false);
    });

    it('should fail to publish a message if the channel is closed before retrying', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockRejectedValue(new MessageDeliveryError('Rejected', true)),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        const promise = channel.publish('foo');

        await channel.close();

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Connection deliberately closed.');
        await expect(promise).rejects.toHaveProperty('retryable', true);
    });

    it('should fail to publish a message if the channel is closed while retrying', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockRejectedValue(new MessageDeliveryError('Rejected', true)),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(60000, 1),
        });

        const promise = channel.publish('foo');

        await new Promise(resolve => { window.setTimeout(resolve, 10); });

        await channel.close();

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Connection deliberately closed.');
        await expect(promise).rejects.toHaveProperty('retryable', true);
    });

    it('should fail to publish a message if maximum retry attempts is reached', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
                .mockRejectedValueOnce(new MessageDeliveryError('Rejected', true))
                .mockRejectedValueOnce(new MessageDeliveryError('Rejected', true)),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        const promise = channel.publish('foo');

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Maximum retry attempts reached.');
        await expect(promise).rejects.toHaveProperty('retryable', false);

        expect(outputChannel.publish).toHaveBeenNthCalledWith(1, 'foo');
        expect(outputChannel.publish).toHaveBeenNthCalledWith(2, 'foo');
        expect(outputChannel.publish).toHaveBeenCalledTimes(2);
    });

    it('should not retry if an error is not retryable', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn().mockRejectedValue(new MessageDeliveryError('Rejected', false)),
        };
        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        const promise = channel.publish('foo');

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Rejected');
        await expect(promise).rejects.toHaveProperty('retryable', false);

        expect(outputChannel.publish).toHaveBeenCalledWith('foo');
    });

    it('should close the output channel on close', async () => {
        const outputChannel: OutputChannel<string> = {
            close: jest.fn(),
            publish: jest.fn(),
        };

        const channel = new RetryChannel<string>({
            channel: outputChannel,
            retryPolicy: new MaxAttemptsPolicy(0, 1),
        });

        await channel.close();

        expect(outputChannel.close).toHaveBeenCalled();
    });
});
