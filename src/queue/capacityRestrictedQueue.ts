import {Queue} from '../queue';

export class CapacityRestrictedQueue<T> implements Queue<T> {
    private readonly queue: Queue<T>;
    private readonly capacity: number;

    constructor(queue: Queue<T>, capacity: number) {
        this.queue = queue;
        this.capacity = capacity;
    }

    all() : T[] {
        return this.queue.all();
    }

    getCapacity(): number {
        return this.capacity;
    }

    isEmpty(): boolean {
        return this.queue.isEmpty();
    }

    length(): number {
        return Math.min(this.capacity, this.queue.length());
    }

    peek(): T | null {
        return this.queue.peek();
    }

    push(value: T): void {
        if (this.queue.length() >= this.capacity) {
            throw new Error('Max queue capacity exceeded');
        }

        this.queue.push(value);
    }

    shift(): T {
        return this.queue.shift();
    }
}