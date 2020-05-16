import {OutputChannel} from './index';
import {Queue} from '../queue';
import Logger from '../logging';
import NullLogger from '../logging/nullLogger';

export default class QueuedChannel<T> implements OutputChannel<T> {
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
            return Promise.reject(new Error('Channel is closed.'));
        }

        if (this.queue.length() >= this.queue.getCapacity()) {
            this.logger.warn('The queue is full, message rejected.');

            return Promise.reject(new Error('The queue is full.'));
        }

        if (this.pending === undefined) {
            this.pending = this.queue.isEmpty()
                ? Promise.resolve()
                : Promise.reject(new Error('The queue must be flushed.'));
        }

        this.enqueue(message);

        this.pending = this.pending.then(() => this.channel.publish(message).then(this.dequeue.bind(this)));

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
            return Promise.reject(new Error('Channel is closed.'));
        }

        this.pending = Promise.resolve();

        if (this.queue.isEmpty()) {
            return this.pending;
        }

        const length = this.queue.length();

        this.logger.debug('Requeuing messages...');
        this.logger.debug(`Queue length: ${length}`);

        for (const message of this.queue.all()) {
            this.pending = this.pending.then(() => this.channel.publish(message).then(this.dequeue.bind(this)));
        }

        return this.pending;
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
