import {Queue} from '../queue';

export class InMemoryQueue<T> implements Queue<T> {
    private queue: T[] = [];

    all() : T[] {
        return this.queue.slice();
    }

    getCapacity(): number {
        return Infinity;
    }

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    push(value: T): void {
        this.queue.push(value);
    }

    peek(): T | null {
        return this.queue[0] || null;
    }

    shift(): T {
        const value = this.queue.shift();

        if (!value) {
            throw new Error('The queue is empty.');
        }

        return value;
    }

    length(): number {
        return this.queue.length;
    }
}