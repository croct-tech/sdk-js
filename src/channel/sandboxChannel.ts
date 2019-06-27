import {ChannelListener, DuplexChannel} from '../channel';

export class SandboxChannel<I, O> implements DuplexChannel<I, O> {
    private readonly listeners: ChannelListener<I>[] = [];
    readonly messages: O[] = [];

    publish(message: O): Promise<void> {
        this.messages.push(message);

        return Promise.resolve();
    }

    notify(message: I): void {
        for (const dispatch of this.listeners) {
            dispatch(message);
        }
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

    close(): Promise<void> {
        return Promise.resolve();
    }
}
