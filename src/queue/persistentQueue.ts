import {Queue} from '../queue';

export class PersistentQueue<T> implements Queue<T> {
    private cache: T[];
    private readonly storage: Storage;
    private readonly key: string;

    constructor(storage: Storage, key: string = 'queue') {
        this.storage = storage;
        this.key = key;
    }

    all() : T[] {
        return this.queue.slice();
    }

    getCapacity(): number {
        return Infinity;
    }

    isEmpty(): boolean {
        return this.length() === 0;
    }

    length(): number {
        return this.queue.length;
    }

    push(value: T): void {
        this.queue.push(value);

        this.flush();
    }

    peek(): T | null {
        return this.queue[0] || null;
    }

    shift(): T {
        const value = this.queue.shift();

        if (!value) {
            throw new Error('The queue is empty.');
        }

        this.flush();

        return value;
    }

    private get queue(): T[] {
        if (!this.cache) {
            this.cache = this.load();
        }

        return this.cache;
    }

    private flush(): void {
        this.storage.setItem(this.key, JSON.stringify(this.cache || []));
    }

    private load(): T[] {
        const data = this.storage.getItem(this.key);

        if (data === null) {
            return [];
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }
}