import {MessageDeliveryError, OutputChannel} from './channel';
import {Queue} from '../queue';
import {Logger, NullLogger} from '../logging';

export class QueuedChannel<T> implements OutputChannel<T> {
    private readonly channel: OutputChannel<T>;

    private readonly queue: Queue<T>;

    private readonly logger: Logger;

    private pending?: Promise<void>;

    private closed = false;

    public constructor(channel: OutputChannel<T>, queue: Queue<T>, logger?: Logger) {
        this.channel = channel;
        this.queue = queue;
        this.logger = logger ?? new NullLogger();
    }

    public flush(): Promise<void> {
        if (this.pending === undefined) {
            return this.requeue();
        }

        return this.pending.catch(this.requeue.bind(this));
    }

    public publish(message: T): Promise<void> {
        if (this.closed) {
            return Promise.reject(MessageDeliveryError.nonRetryable('Channel is closed.'));
        }

        if (this.queue.length() >= this.queue.getCapacity()) {
            this.logger.warn('The queue is full, message rejected.');

            return Promise.reject(MessageDeliveryError.retryable('The queue is full.'));
        }

        if (this.pending === undefined) {
            this.pending = this.requeue();
        }

        this.pending = this.chainNext(this.pending, message, true);

        return this.pending;
    }

    private enqueue(message: T): void {
        this.logger.debug('Enqueueing message...');
        this.logger.debug(`Queue length: ${this.queue.length() + 1}`);

        this.queue.push(message);
    }

    private dequeue(): void {
        this.logger.debug('Dequeuing message...');
        this.logger.debug(`Queue length: ${Math.max(0, this.queue.length() - 1)}`);

        this.queue.shift();
    }

    private requeue(): Promise<void> {
        if (this.closed) {
            return Promise.reject(MessageDeliveryError.nonRetryable('Channel is closed.'));
        }

        this.pending = Promise.resolve();

        if (this.queue.isEmpty()) {
            return this.pending;
        }

        const length = this.queue.length();

        this.logger.debug('Requeuing messages...');
        this.logger.debug(`Queue length: ${length}`);

        for (const message of this.queue.all()) {
            this.pending = this.chainNext(this.pending, message);
        }

        return this.pending;
    }

    private async chainNext(previous: Promise<void>, message: T, enqueue = false): Promise<void> {
        if (enqueue) {
            this.enqueue(message);
        }

        try {
            await previous;
        } catch (error) {
            if (error instanceof MessageDeliveryError && error.retryable) {
                // If the previous message failed to deliver, requeue all messages
                // including the current one that was just enqueued
                return this.requeue();
            }

            throw error;
        }

        try {
            const result = await this.channel.publish(message);

            this.dequeue();

            return result;
        } catch (error) {
            if (!(error instanceof MessageDeliveryError) || !error.retryable) {
                // Discard the message if it's non-retryable so that the next message
                // in the queue can be processed
                this.dequeue();
            }

            throw error;
        }
    }

    public async close(): Promise<void> {
        this.closed = true;

        await this.channel.close();

        if (this.pending !== undefined) {
            try {
                await this.pending;
            } catch {
                // suppress errors
            }
        }
    }
}
