import {formatMessage} from '../error';

export class MessageDeliveryError extends Error {
    public readonly retryable: boolean;

    private constructor(message: string, retryable: boolean) {
        super(message);

        this.retryable = retryable;

        Object.setPrototypeOf(this, MessageDeliveryError.prototype);
    }

    public static retryable(cause: unknown): MessageDeliveryError {
        return MessageDeliveryError.fromCause(cause, true);
    }

    public static nonRetryable(cause: unknown): MessageDeliveryError {
        return MessageDeliveryError.fromCause(cause, false);
    }

    private static fromCause(cause: unknown, retryable: boolean): MessageDeliveryError {
        const error = new MessageDeliveryError(formatMessage(cause), retryable);

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
