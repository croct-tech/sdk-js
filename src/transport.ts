import {Beacon} from "./beacon";
import {Logger, NullLogger} from "./logging";

export interface BeaconTransport {
    connect() : void;
    disconnect() : void;
    send(beacon: Beacon) : void;
}

interface BeaconQueue {
    push(beacon: Beacon) : void;
    pop() : Beacon;
    isEmpty() : boolean;
    length() : number;
}

export class InMemoryQueue implements BeaconQueue {
    private queue: Beacon[] = [];

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    pop(): Beacon {
        const beacon = this.queue.pop();

        if (!beacon) {
            throw new Error('The queue is empty.');
        }

        return beacon;
    }

    push(beacon: Beacon): void {
        this.queue.unshift(beacon);
    }

    length(): number {
        return this.queue.length;
    }
}

export class WebStorageQueue implements BeaconQueue {
    private cache: Beacon[] = [];
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

    pop(): Beacon {
        const beacon = this.queue.pop();

        if (!beacon) {
            throw new Error('The queue is empty.');
        }

        this.flush();

        return beacon;
    }

    push(beacon: Beacon): void {
        this.queue.unshift(beacon);

        this.flush();
    }

    private get queue() : Beacon[] {
        if (!this.cache) {
            this.cache = this.load();
        }

        return this.cache;
    }

    private flush() : void {
        this.storage.setItem(this.key, JSON.stringify(this.cache));
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

export class WebSocketTransport implements BeaconTransport {
    private readonly url: string;
    private readonly protocols : string | string[];
    private readonly retryDelay: number;
    private readonly logger: Logger;
    private connection: WebSocket;
    private queue: BeaconQueue;

    constructor(
        url: string,
        protocols: string | string[] = [],
        queue?: BeaconQueue,
        retryDelay: number = 1000,
        logger?: Logger
    ) {
        this.url = url;
        this.protocols = protocols || [];
        this.queue = queue || new InMemoryQueue();
        this.retryDelay = retryDelay;
        this.logger = logger || new NullLogger();
    }

    send(beacon: Beacon): void {
        this.queue.push(beacon);

        this.flush();
    }

    private flush() : void {
        this.logger.info('Flushing beacons...');
        this.logger.info(`Queue length: ${this.queue.length()}`);

        while (!this.queue.isEmpty()) {
            if (!this.connection) {
                this.connect();

                return;
            }

            if (this.connection.readyState !== WebSocket.OPEN) {
                this.logger.info('Waiting for connection...');

                return;
            }

            const beacon = this.queue.pop();

            this.logger.info('Sending beacon...', beacon);

            this.connection.send(JSON.stringify(beacon));
        }
    }

    connect() : void {
        if (this.connection) {
            return;
        }

        this.logger.info('Connecting to websocket server...');

        const connection = new WebSocket(this.url, this.protocols);

        connection.onopen = () => {
            this.logger.info('Connection established');
            this.flush();
        };

        connection.onclose = (event: CloseEvent) => {
            this.logger.error(`Connection closed, reason: ${event.reason || 'unknown'}`);

            if (this.retryDelay > 0) {
                this.logger.info(`Reconnecting in ${Math.floor(this.retryDelay / 1000)} seconds...`);

                setTimeout(() => this.connect(), this.retryDelay);
            }
        };

        connection.onmessage = (event: MessageEvent) => {
            this.logger.error('Message received: ' + event.data);
        };

        connection.onerror = () => {
            this.logger.error('Connection error, closing...');

            if (connection.readyState !== WebSocket.OPEN) {
                connection.close();
            }
        };

        this.connection = connection;
    }

    disconnect() : void {
        if (!this.connection) {
            return;
        }

        this.connection.onclose = null;
        this.connection.onmessage = null;
        this.connection.onerror = null;
        this.connection.onopen = null;

        this.connection.close();

        delete this.connection;

        this.logger.info('Disconnected from websocket server.');
    }
}