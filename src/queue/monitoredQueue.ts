import {Queue} from '../queue';
import {Logger} from '../logger';
import {NullLogger} from '../logger/nullLogger';

export type Status = 'halfEmpty' | 'almostEmpty' | 'empty' | 'halfFull' | 'almostFull' | 'full';

export type Callback<T> = {
    (queue: Queue<T>): void;
};

export class MonitoredQueue<T> implements Queue<T> {
    private readonly queue: Queue<T>;
    private readonly logger: Logger;
    private readonly callbacks: Partial<{[key in Status]: Callback<T>[]}> = {};
    private status: Status;

    constructor(queue: Queue<T>, logger?: Logger) {
        this.queue = queue;
        this.logger = logger || new NullLogger();

        this.updateStatus();
    }

    all() : T[] {
        return this.queue.all();
    }

    getCapacity(): number {
        return this.queue.getCapacity();
    }

    addCallback(status: Status, callback: Callback<T>) : void {
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

    removeCallback(type: Status, callback: Callback<T>) : void {
        const callbacks = this.callbacks[type];

        if (!callbacks) {
            return;
        }

        const index = callbacks.indexOf(callback);

        if (index >= 0) {
            callbacks.splice(index, 1);
        }
    }

    private setStatus(status: Status) : void {
        if (this.status === status) {
            return;
        }

        this.logger.info(`Queue status changed to '${status}'`);

        this.report(status);

        this.status = status;
    }

    private report(status: Status) {
        for (const callback of this.callbacks[status] || []) {
            callback(this);
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
        }
    }

    isEmpty(): boolean {
        return this.queue.isEmpty();
    }

    length(): number {
        return this.queue.length();
    }

    peek(): T | null {
        return this.queue.peek();
    }

    push(value: T): void {
        this.queue.push(value);

        this.updateStatus();
    }

    shift(): T {
        const value = this.queue.shift();

        this.updateStatus();

        return value
    }

    private updateStatus() : void {
        const length = this.queue.length();
        const capacity = this.getCapacity();

        if (length <= capacity * .5) {
            if (length === 0) {
                this.setStatus('empty');
            } else if (length <= capacity * .25) {
                this.setStatus('almostEmpty');
            } else {
                this.setStatus('halfEmpty');
            }

            return;
        }

        if (length >= capacity) {
            this.setStatus('full')
        } else if (length >= capacity * .75) {
            this.setStatus('almostFull');
        } else {
            this.setStatus('halfFull');
        }
    }
}