import {Envelope, GuaranteedChannel, MessageStamper, TimeStamper} from '../../src/channel/guaranteedChannel';
import {MessageDeliveryError, SandboxChannel} from '../../src/channel';

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

    it('should acknowledge messages confirmed before the specified timeout is reached', async () => {
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

    it('should fail if no confirmation is received before the specified timeout is reached', async () => {
        expect(sandboxChannel.messages).toHaveLength(0);

        const promise = channel.publish('ping');

        expect(sandboxChannel.messages).toHaveLength(1);

        const [message] = sandboxChannel.messages;

        expect(message).toMatchObject({
            message: 'ping',
        });

        // Invalid acknowledge stamp
        sandboxChannel.notify('pong_stamp');

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Maximum confirmation time reached.');
        await expect(promise).rejects.toHaveProperty('retryable', true);
    });

    it('should stop waiting for confirmation if the channel is closed in the meanwhile', async () => {
        const promise = channel.publish('foo');

        await new Promise(resolve => { window.setTimeout(resolve, 1); });

        await channel.close();

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Connection deliberately closed.');
        await expect(promise).rejects.toHaveProperty('retryable', false);
    });

    it('should close the output channel on close', async () => {
        await channel.close();

        expect(sandboxChannel.isClosed()).toBeTruthy();
    });

    it('should fail to publish messages if the channel is closed', async () => {
        await channel.close();

        const promise = channel.publish('foo');

        await expect(promise).rejects.toThrowWithMessage(MessageDeliveryError, 'Channel is closed.');
        await expect(promise).rejects.toHaveProperty('retryable', false);
    });
});

describe('A time stamper', () => {
    it('should stamp messages with the current time', () => {
        const timeStamper = new TimeStamper();

        const date = jest.spyOn(Date, 'now');
        const now = Date.now();

        date.mockReturnValue(now);

        expect(timeStamper.generate()).toBe(now.toString());
    });
});
