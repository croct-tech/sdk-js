import {OutputChannel} from '../channel';
import {Queue} from '../queue';
import {Logger} from '../logger';
import {NullLogger} from '../logger/nullLogger';
import {formatMessage} from '../error';

export class QueuedChannel<T> implements OutputChannel<T> {
    private readonly channel: OutputChannel<T>;
    private readonly queue: Queue<T>;
    private readonly logger: Logger;
    private promise: Promise<void> = Promise.resolve();
    private closed: boolean = false;

    constructor(channel: OutputChannel<T>, queue: Queue<T>, logger?: Logger) {
        this.channel = channel;
        this.queue = queue;
        this.logger = logger || new NullLogger();

        this.requeue();
    }

    publish(message: T): Promise<void> {
        if (this.closed) {
            return Promise.reject('The channel is closed');
        }

        if (this.queue.length() >= this.queue.getCapacity()) {
            this.logger.info('The queue is full, message rejected');

            return Promise.reject('The queue is full');
        }

        this.logger.info('Enqueueing message...');
        this.logger.info(`Queue length: ${this.queue.length() + 1}`);

        this.queue.push(message);

        return this.promise = this.push(message);
    }

    private requeue() : void {
        this.logger.info('Requeuing messages...');
        this.logger.info(`Queue length: ${this.queue.length()}`);

        for (const item of this.queue.all()) {
            this.promise = this.push(item).catch(error =>
                this.logger.info(formatMessage(error))
            );
        }
    }

    private push(message: T) : Promise<void> {
        return this.promise.finally(() => {
            if (this.closed) {
                throw new Error('Channel is closed');
            }

            const promise = this.channel.publish(message);

            promise.finally(() => {
                this.logger.info('Dequeuing message...');
                this.logger.info(`Queue length: ${Math.max(0, this.queue.length() - 1)}`);

                const item = this.queue.shift();

                if (item !== message) {
                    throw Error('Unexpected item at the head of the queue');
                }
            });

            return promise;
        });
    }

    close(): Promise<void> {
        this.closed = true;

        return this.channel.close();
    }
}