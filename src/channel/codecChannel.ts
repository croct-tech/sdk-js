import {ChannelListener, DuplexChannel} from '../channel';
import {Transformer} from '../transformer';

export class CodecChannel<I, O, E, D> implements DuplexChannel<I, O> {
    private readonly channel: DuplexChannel<E, D>;
    private readonly encode: Transformer<O, D>;
    private readonly decode: Transformer<E, I>;
    private readonly listeners: ChannelListener<I>[] = [];

    constructor(channel: DuplexChannel<E, D>, encoder: Transformer<O, D>, decoder: Transformer<E, I>) {
        this.channel = channel;
        this.encode = encoder;
        this.decode = decoder;
        this.notify = this.notify.bind(this);

        channel.subscribe(this.notify);
    }

    publish(message: O): Promise<void> {
        return this.encode(message).then(result =>
            this.channel.publish(result)
        )
    }

    subscribe(listener: ChannelListener<I>): void {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    unsubscribe(listener: ChannelListener<I>): void {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    private notify(message: E): void {
        this.decode(message).then(result => {
            this.listeners.forEach(dispatch => dispatch(result))
        });
    }

    close(): Promise<void> {
        this.channel.unsubscribe(this.notify);

        return this.channel.close();
    }
}