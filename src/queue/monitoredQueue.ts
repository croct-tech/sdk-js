import {Queue} from '../queue';
import Logger from '../logger';
import NullLogger from '../logger/nullLogger';

export type Status = 'halfEmpty' | 'almostEmpty' | 'empty' | 'halfFull' | 'almostFull' | 'full';

export type Callback<T> = {
    (queue: Queue<T>): void,
};

export default class MonitoredQueue<T> implements Queue<T> {
    private readonly queue: Queue<T>;

    private readonly logger: Logger;

    private readonly callbacks: Partial<{ [key in Status]: Callback<T>[] }> = {};

    private status: Status;

    public constructor(queue: Queue<T>, logger?: Logger) {
        this.queue = queue;
        this.logger = logger ?? new NullLogger();

        this.updateStatus();
    }

    public all(): T[] {
        return this.queue.all();
    }

    public getCapacity(): number {
        return this.queue.getCapacity();
    }

    public addCallback(status: Status, callback: Callback<T>): void {
        const callbacks = this.callbacks[status] || [];

        if (!callbacks.includes(callback)) {
            callbacks.push(callback);
        }

        this.callbacks[status] = callbacks;

        switch (this.status) {
            case status:
                callback(this);
                break;

            case 'empty':
            case 'almostEmpty':
                if (status === 'halfEmpty') {
                    callback(this);
                }
                break;

            case 'full':
            case 'almostFull':
                if (status === 'halfFull') {
                    callback(this);
                }
                break;
        }
    }

    public removeCallback(type: Status, callback: Callback<T>): void {
        const callbacks = this.callbacks[type];

        if (!callbacks) {
            return;
        }

        const index = callbacks.indexOf(callback);

        if (index >= 0) {
            callbacks.splice(index, 1);
        }
    }

    private setStatus(status: Status): void {
        if (this.status === status) {
            return;
        }

        this.logger.debug(`Queue status changed to "${status}"`);

        this.report(status);

        this.status = status;
    }

    private report(status: Status): void {
        const callbacks = this.callbacks[status];

        if (callbacks !== undefined) {
            callbacks.forEach(callback => callback(this));
        }

        switch (status) {
            case 'empty':
            case 'almostEmpty':
                this.report('halfEmpty');
                break;

            case 'full':
            case 'almostFull':
                this.report('halfFull');
                break;

            default:
                break;
        }
    }

    public isEmpty(): boolean {
        return this.queue.isEmpty();
    }

    public length(): number {
        return this.queue.length();
    }

    public peek(): T | null {
        return this.queue.peek();
    }

    public push(value: T): void {
        this.queue.push(value);

        this.updateStatus();
    }

    public shift(): T {
        const value = this.queue.shift();

        this.updateStatus();

        return value;
    }

    private updateStatus(): void {
        const length = this.queue.length();
        const capacity = this.getCapacity();

        if (length <= capacity * 0.5) {
            if (length === 0) {
                this.setStatus('empty');
            } else if (length <= capacity * 0.25) {
                this.setStatus('almostEmpty');
            } else {
                this.setStatus('halfEmpty');
            }

            return;
        }

        if (length >= capacity) {
            this.setStatus('full');
        } else if (length >= capacity * 0.75) {
            this.setStatus('almostFull');
        } else {
            this.setStatus('halfFull');
        }
    }
}
