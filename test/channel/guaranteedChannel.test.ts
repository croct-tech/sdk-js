import {Envelope, GuaranteedChannel, MessageStamper, TimeStamper} from '../../src/channel/guaranteedChannel';
import SandboxChannel from '../../src/channel/sandboxChannel';

describe('A guaranteed channel', () => {
    let stamper: MessageStamper<string, string>;
    let sandboxChannel: SandboxChannel<string, Envelope<string, string>>;
    let channel: GuaranteedChannel<string, string>;

    beforeEach(() => {
        sandboxChannel = new SandboxChannel<string, Envelope<string, string>>();
        stamper = {generate: jest.fn((input: string) => `${input}_stamp`)};
        channel = new GuaranteedChannel<string, string>({
            channel: sandboxChannel,
            stamper: stamper,
            ackTimeout: 5,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should acknowledge messages confirmed before the specified timeout is reached', async () => {
        expect(sandboxChannel.messages).toHaveLength(0);

        const promise = channel.publish('ping');

        expect(sandboxChannel.messages).toHaveLength(1);

        const [message] = sandboxChannel.messages;

        expect(message).toMatchObject({
            message: 'ping',
        });

        sandboxChannel.notify('ping_stamp');

        await expect(promise).resolves.toBeUndefined();
    });

    test('should fail if no confirmation is received before the specified timeout is reached', async () => {
        expect(sandboxChannel.messages).toHaveLength(0);

        const promise = channel.publish('ping');

        expect(sandboxChannel.messages).toHaveLength(1);

        const [message] = sandboxChannel.messages;

        expect(message).toMatchObject({
            message: 'ping',
        });

        // Invalid acknowledge stamp
        sandboxChannel.notify('pong_stamp');

        await expect(promise).rejects.toThrow('Maximum confirmation time reached.');
    });

    test('should stop waiting for confirmation if the channel is closed in the meanwhile', async () => {
        const promise = channel.publish('foo');

        await new Promise(resolve => window.setTimeout(resolve, 1));

        await channel.close();

        await expect(promise).rejects.toEqual(new Error('Connection deliberately closed.'));
    });

    test('should close the output channel on close', async () => {
        await channel.close();

        expect(sandboxChannel.isClosed()).toBeTruthy();
    });

    test('should fail to publish messages if the channel is closed', async () => {
        await channel.close();

        await expect(channel.publish('foo')).rejects.toEqual(new Error('Channel is closed.'));
    });
});

describe('A time stamper', () => {
    test('should stamp messages with the current time', () => {
        const timeStamper = new TimeStamper();

        const date = jest.spyOn(Date, 'now');
        const now = Date.now();
        date.mockReturnValue(now);

        expect(timeStamper.generate()).toBe(now.toString());
    });
});
