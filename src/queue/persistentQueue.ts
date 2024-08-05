import {Queue} from './queue';

export class PersistentQueue<T> implements Queue<T> {
    private readonly storage: Storage;

    private readonly key: string;

    public constructor(storage: Storage, key = 'queue') {
        this.storage = storage;
        this.key = key;
    }

    public all(): T[] {
        return this.queue.slice();
    }

    public getCapacity(): number {
        return Number.MAX_SAFE_INTEGER;
    }

    public isEmpty(): boolean {
        return this.length() === 0;
    }

    public length(): number {
        return this.queue.length;
    }

    public push(value: T): void {
        this.save([...this.queue, value]);
    }

    public peek(): T | null {
        const item = this.queue[0];

        if (item === undefined) {
            return null;
        }

        return item;
    }

    public shift(): T {
        const queue = [...this.queue];
        const value = queue.shift();

        if (value === undefined) {
            throw new Error('The queue is empty.');
        }

        this.save(queue);

        return value;
    }

    private get queue(): readonly T[] {
        const data = this.storage.getItem(this.key);

        if (data === null) {
            return [];
        }

        try {
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    private save(data: T[]): void {
        this.storage.setItem(this.key, JSON.stringify(data));
    }
}
