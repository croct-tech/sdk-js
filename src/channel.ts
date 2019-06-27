interface Closeable {
    close(): Promise<void>
}

export interface OutputChannel<O> extends Closeable {
    publish(message: O): Promise<void>
}

export type ChannelListener<T> = {
    (message: T): void;
}

export interface InputChannel<I> extends Closeable {
    subscribe(listener: ChannelListener<I>): void

    unsubscribe(listener: ChannelListener<I>): void
}

export interface DuplexChannel<I, O> extends InputChannel<I>, OutputChannel<O> {
}