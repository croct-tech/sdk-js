import {ChannelListener, DuplexChannel, MessageDeliveryError} from './channel';

export class SandboxChannel<I, O> implements DuplexChannel<I, O> {
    private readonly listeners: Array<ChannelListener<I>> = [];

    public readonly messages: O[] = [];

    private closed = false;

    public publish(message: O): Promise<void> {
        if (this.closed) {
            return Promise.reject(MessageDeliveryError.nonRetryable('Channel is closed.'));
        }

        this.messages.push(message);

        return Promise.resolve();
    }

    public notify(message: I): void {
        this.listeners.forEach(dispatch => dispatch(message));
    }

    public subscribe(listener: ChannelListener<I>): void {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    public unsubscribe(listener: ChannelListener<I>): void {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    public close(): Promise<void> {
        this.closed = true;

        return Promise.resolve();
    }

    public isClosed(): boolean {
        return this.closed;
    }
}
