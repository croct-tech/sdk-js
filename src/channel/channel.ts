import {formatMessage} from '../error';

export class MessageDeliveryError extends Error {
    public readonly retryable: boolean;

    public constructor(message: string, retryable: boolean) {
        super(message);

        this.retryable = retryable;

        Object.setPrototypeOf(this, MessageDeliveryError.prototype);
    }

    public static fromCause(cause: any, retryable?: boolean): MessageDeliveryError {
        if (cause instanceof MessageDeliveryError) {
            return cause;
        }

        const error = new MessageDeliveryError(formatMessage(cause), retryable ?? true);

        if (cause instanceof Error) {
            error.stack = cause.stack;
        }

        return error;
    }
}

export interface Closeable {
    close(): Promise<void>;
}

export interface OutputChannel<O> extends Closeable {
    publish(message: O): Promise<void>;
}

export type ChannelListener<T> = {
    (message: T): void,
};

export interface InputChannel<I> extends Closeable {
    subscribe(listener: ChannelListener<I>): void;

    unsubscribe(listener: ChannelListener<I>): void;
}

export interface DuplexChannel<I, O> extends InputChannel<I>, OutputChannel<O> {
}
