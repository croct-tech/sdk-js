import {Queue} from './queue';

export class CapacityRestrictedQueue<T> implements Queue<T> {
    private readonly queue: Queue<T>;

    private readonly capacity: number;

    public constructor(queue: Queue<T>, capacity: number) {
        this.queue = queue;
        this.capacity = capacity;
    }

    public all(): T[] {
        return this.queue.all();
    }

    public getCapacity(): number {
        return this.capacity;
    }

    public isEmpty(): boolean {
        return this.queue.isEmpty();
    }

    public length(): number {
        return Math.min(this.capacity, this.queue.length());
    }

    public peek(): T | null {
        return this.queue.peek();
    }

    public push(value: T): void {
        if (this.queue.length() >= this.capacity) {
            throw new Error('Maximum queue capacity reached.');
        }

        this.queue.push(value);
    }

    public shift(): T {
        return this.queue.shift();
    }
}
