import {Queue} from '../queue';

export default class PersistentQueue<T> implements Queue<T> {
    private cache: T[];

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
        return Infinity;
    }

    public isEmpty(): boolean {
        return this.length() === 0;
    }

    public length(): number {
        return this.queue.length;
    }

    public push(value: T): void {
        this.queue.push(value);

        this.flush();
    }

    public peek(): T | null {
        const item = this.queue[0];

        if (item === undefined) {
            return null;
        }

        return item;
    }

    public shift(): T {
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
