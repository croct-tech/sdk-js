import {SandboxChannel} from '../../src/channel';

describe('A sandbox channel', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should record published messages', async () => {
        const channel = new SandboxChannel<string, string>();

        await channel.publish('foo');

        expect(channel.messages).toEqual(['foo']);
    });

    test('should notify registered listeners', async () => {
        const channel = new SandboxChannel<string, string>();
        const listener = jest.fn();

        channel.subscribe(listener);

        channel.notify('foo');

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith('foo');
    });

    test('should not notify unregistered listeners', async () => {
        const channel = new SandboxChannel<string, string>();
        const listener = jest.fn();

        channel.subscribe(listener);
        channel.unsubscribe(listener);

        channel.notify('foo');

        expect(listener).toHaveBeenCalledTimes(0);
    });

    test('should be closeable', async () => {
        const channel = new SandboxChannel<string, string>();

        expect(channel.isClosed()).toBe(false);

        await channel.close();

        expect(channel.isClosed()).toBe(true);
    });
});
