import {OutputChannel} from '../channel';
import {Transformer} from '../transformer';

export default class EncodedChannel<D, E> implements OutputChannel<D> {
    private readonly encode: Transformer<D, E>;

    private readonly channel: OutputChannel<E>;

    public constructor(channel: OutputChannel<E>, encoder: Transformer<D, E>) {
        this.channel = channel;
        this.encode = encoder;
    }

    public publish(message: D): Promise<void> {
        return this.encode(message).then((result => this.channel.publish(result)));
    }

    public close(): Promise<void> {
        return this.channel.close();
    }
}
