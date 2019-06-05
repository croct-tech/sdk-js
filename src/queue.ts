import {Beacon} from "./beacon";

export interface BeaconQueue {
    push(beacon: Beacon) : void;
    shift() : Beacon;
    peek() : Beacon | null;
    isEmpty() : boolean;
    length() : number;
}

export class InMemoryQueue implements BeaconQueue {
    private queue: Beacon[] = [];

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    push(beacon: Beacon): void {
        this.queue.push(beacon);
    }

    peek(): Beacon | null {
        return this.queue[0] || null;
    }

    shift(): Beacon {
        const beacon = this.queue.shift();

        if (!beacon) {
            throw new Error('The queue is empty.');
        }

        return beacon;
    }

    length(): number {
        return this.queue.length;
    }
}

export class WebStorageQueue implements BeaconQueue {
    private cache: Beacon[];
    private readonly storage: Storage;
    private readonly key: string;

    constructor(storage: Storage, key: string = 'queue') {
        this.storage = storage;
        this.key = key;
    }

    isEmpty(): boolean {
        return this.length() === 0;
    }

    length(): number {
        return this.queue.length;
    }

    push(beacon: Beacon): void {
        this.queue.push(beacon);

        this.flush();
    }

    peek(): Beacon | null {
        return this.queue[0] || null;
    }

    shift(): Beacon {
        const beacon = this.queue.shift();

        if (!beacon) {
            throw new Error('The queue is empty.');
        }

        this.flush();

        return beacon;
    }

    private get queue() : Beacon[] {
        if (!this.cache) {
            this.cache = this.load();
        }

        return this.cache;
    }

    private flush() : void {
        this.storage.setItem(this.key, JSON.stringify(this.cache || []));
    }

    private load() : Beacon[] {
        let data = this.storage.getItem(this.key);

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