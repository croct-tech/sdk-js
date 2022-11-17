import {Queue} from './queue';

export class InMemoryQueue<T> implements Queue<T> {
    private queue: T[] = [];

    public constructor(...values: T[]) {
        this.queue.unshift(...values);
    }

    public all(): T[] {
        return this.queue.slice();
    }

    public getCapacity(): number {
        return Infinity;
    }

    public isEmpty(): boolean {
        return this.queue.length === 0;
    }

    public push(value: T): void {
        this.queue.push(value);
    }

    public peek(): T | null {
        return this.queue[0] ?? null;
    }

    public shift(): T {
        const value = this.queue.shift();

        if (value === undefined) {
            throw new Error('The queue is empty.');
        }

        return value;
    }

    public length(): number {
        return this.queue.length;
    }
}
