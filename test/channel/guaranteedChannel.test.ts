import {GuaranteedChannel, Envelope} from "../../src/channel/guaranteedChannel";
import {SandboxChannel} from "../../src/channel/sandboxChannel";

test('should acknowledge messages received within 5 ms', async () => {
    const sandboxChannel = new SandboxChannel<string, Envelope<string, string>>();
    const guaranteedChannel = new GuaranteedChannel<string, string>({
        channel: sandboxChannel,
        stamper: message => message + '_stamp',
        ackTimeout: 5,
    });

    expect(sandboxChannel.messages).toHaveLength(0);

    const promise = guaranteedChannel.publish('ping');

    expect(sandboxChannel.messages).toHaveLength(1);

    const [message] = sandboxChannel.messages;

    expect(message).toMatchObject({
        stamp: 'ping_stamp',
        message: 'ping'
    });

    sandboxChannel.notify(message.stamp);

    await expect(promise).resolves.toBeUndefined();
});

test('should timeout after 5 ms', async () => {
    const sandboxChannel = new SandboxChannel<string, Envelope<string, string>>();

    const guaranteedChannel = new GuaranteedChannel<string, string>({
        channel: sandboxChannel,
        stamper: message => message + '_stamp',
        ackTimeout: 5,
    });

    expect(sandboxChannel.messages).toHaveLength(0);

    const promise = guaranteedChannel.publish('ping');

    expect(sandboxChannel.messages).toHaveLength(1);

    const [message] = sandboxChannel.messages;

    expect(message).toMatchObject({
        stamp: 'ping_stamp',
        message: 'ping'
    });

    // Invalid acknowledge stamp
    sandboxChannel.notify('pong_stamp');

    await expect(promise).rejects.toThrowError(/timeout/i);
});