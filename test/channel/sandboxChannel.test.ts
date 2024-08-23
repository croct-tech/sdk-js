import {MessageDeliveryError, SandboxChannel} from '../../src/channel';

describe('A sandbox channel', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should record published messages', async () => {
        const channel = new SandboxChannel<string, string>();

        await channel.publish('foo');

        expect(channel.messages).toEqual(['foo']);
    });

    it('should notify registered listeners', () => {
        const channel = new SandboxChannel<string, string>();
        const listener = jest.fn();

        channel.subscribe(listener);

        channel.notify('foo');

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith('foo');
    });

    it('should not notify unregistered listeners', () => {
        const channel = new SandboxChannel<string, string>();
        const listener = jest.fn();

        channel.subscribe(listener);
        channel.unsubscribe(listener);

        channel.notify('foo');

        expect(listener).toHaveBeenCalledTimes(0);
    });

    it('should be closeable', async () => {
        const channel = new SandboxChannel<string, string>();

        expect(channel.isClosed()).toBe(false);

        await channel.close();

        expect(channel.isClosed()).toBe(true);

        const promise = channel.publish('foo');

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Channel is closed.');
        await expect(promise).rejects.toHaveProperty('retryable', false);
    });
});
