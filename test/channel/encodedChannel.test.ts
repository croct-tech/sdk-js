import {EncodedChannel, OutputChannel} from '../../src/channel';

describe('An encoded channel', () => {
    let outputChannel: OutputChannel<string>;
    let channel: EncodedChannel<string, string>;

    beforeEach(() => {
        outputChannel = {
            close: jest.fn(),
            publish: jest.fn(),
        };

        channel = new EncodedChannel<string, string>(
            outputChannel,
            (input: string) => Promise.resolve(`${input}-pong`),
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should encode and then publish the message', async () => {
        await channel.publish('ping');

        expect(outputChannel.publish).toHaveBeenCalledWith('ping-pong');
    });

    it('should close the output channel on close', async () => {
        await channel.close();

        expect(outputChannel.close).toHaveBeenCalled();
    });
});
