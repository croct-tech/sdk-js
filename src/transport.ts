import {Beacon} from "./beacon";
import {Logger, NullLogger} from "./logging";
import {RetryPolicy} from "./retry";

type TransmissionCallback = {
    (beacon: Beacon, error?: Error) : void
};

class BeaconTransmission {
    readonly id: string;
    readonly beacon: Beacon;
    private readonly successCallbacks: TransmissionCallback[] = [];
    private readonly failureCallbacks: TransmissionCallback[] = [];
    currentAttempt: number = 0;
    private resolved: boolean = false;
    private error?: Error;

    constructor(id: string, beacon: Beacon) {
        this.id = id;
        this.beacon = beacon;
    }

    get attempt() : number {
        return this.currentAttempt;
    }

    set attempt(attempt: number){
        if (attempt < this.currentAttempt) {
            throw new Error(`The attempt number must be greater than ${this.currentAttempt}`);
        }

        this.currentAttempt = attempt;
    }

    succeeded() : void {
        if (this.resolved) {
            throw new Error('Transmission already resolved');
        }

        this.resolved = true;

        for (let callback of this.successCallbacks) {
            callback(this.beacon);
        }
    }

    failed(error: Error) : void {
        if (this.resolved) {
            throw new Error('Transmission already resolved');
        }

        this.resolved = true;
        this.error = error;

        for (let callback of this.failureCallbacks) {
            callback(this.beacon, error);
        }
    }

    onSuccess(callback: TransmissionCallback) : BeaconTransmission {
        if (!this.resolved) {
            this.successCallbacks.push(callback);

            return this;
        }

        if (!this.error) {
            callback(this.beacon);
        }

        return this;
    }

    onFailure(callback: TransmissionCallback): BeaconTransmission {
        if (!this.resolved) {
            this.failureCallbacks.push(callback);

            return this;
        }

        if (this.error) {
            callback(this.beacon, this.error);
        }

        return this;
    }
}

export class BeaconPromise {
    private readonly transmission: BeaconTransmission;

    constructor(transmission: BeaconTransmission) {
        this.transmission = transmission;
    }

    then(callback: TransmissionCallback) : BeaconPromise {
        this.transmission.onSuccess(callback);

        return this;
    }

    catch(callback: TransmissionCallback) : BeaconPromise {
        this.transmission.onFailure(callback);

        return this;
    }

    finally(callback: TransmissionCallback) : BeaconPromise {
        return this.then(callback).catch(callback);
    }
}

export interface BeaconTransport {
    send(beacon: Beacon) : BeaconPromise;
    close() : void;
}

function ab2str(buf: number[]) : string {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str: string) : ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
}

export class WebSocketTransport implements BeaconTransport {
    private readonly url: string;
    private readonly protocols : string | string[];
    private readonly retryPolicy: RetryPolicy<Beacon>;
    private readonly ackTimeout: number;
    private readonly logger: Logger;
    private connection: WebSocket;
    private transmission?: BeaconTransmission;
    private queue: BeaconTransmission[] = [];

    constructor(
        url: string,
        protocols: string | string[],
        retryPolicy: RetryPolicy<Beacon>,
        ackTimeout: number,
        logger?: Logger
    ) {
        this.url = url;
        this.protocols = protocols || [];
        this.retryPolicy = retryPolicy;
        this.ackTimeout = ackTimeout;
        this.logger = logger || new NullLogger();
    }

    send(beacon: Beacon): BeaconPromise {
        const transmission = new BeaconTransmission(Date.now() + '', beacon);

        this.queue.unshift(transmission);

        setTimeout(() => this.flush(), 0);

        return new BeaconPromise(transmission);
    }

    private flush() : void {
        if (this.transmission) {
            return;
        }

        this.logger.info('Flushing beacons...');
        this.logger.info(`Queue length: ${this.queue.length}`);

        this.transmission = this.queue.pop();

        if (this.transmission) {
            this.resume();
        }
    }

    private resume(error?: Error) {
        if (!this.transmission) {
            this.flush();

            return;
        }

        const {id, attempt, beacon} = this.transmission;

        if (error) {
            if (!this.retryPolicy.shouldRetry(beacon, attempt, error)) {
                this.logger.log('Max attempts exhausted');

                this.transmission.failed(error);

                delete this.transmission;

                this.flush();

                return;
            }

            const nextAttempt = attempt + 1;

            this.transmission.attempt = nextAttempt;

            const delay = this.retryPolicy.getDelay(nextAttempt);

            this.logger.log(`Retrying in ${delay / 1000} seconds...`);

            this.schedule(id, nextAttempt, delay, () => this.resume());

            return;
        }

        this.logger.info('Sending beacon...', {
            transmission: id,
            attempt: attempt,
            beacon: beacon,
        });

        if (!this.connection) {
            this.connect();

            return;
        }

        if (this.connection.readyState !== WebSocket.OPEN) {
            this.logger.info('Waiting for connection...');

            return;
        }

        this.connection.send(str2ab(JSON.stringify({
            id: id,
            data: beacon
        })));

        this.schedule(id, attempt, this.ackTimeout, () => {
            this.resume(new Error('Acknowledgement timeout'));
        });
    }

    private schedule(id: string, attempt: number, delay: number, callback: {() : void}) : void {
        setTimeout(() =>  {
            if (this.transmission
                && this.transmission.id === id
                && this.transmission.attempt === attempt) {
                callback();
            }
        }, delay);
    }

    private acknowledge(transmissionId: string) {
        const transmission = this.transmission;

        if (!transmission || transmission.id !== transmissionId) {
            this.logger.info(`Delayed acknowledgement: ${transmissionId}`);

            return;
        }

        this.logger.info(`Acknowledgement received: ${transmissionId}`);

        delete this.transmission;

        transmission.succeeded();
    }

    private connect() : void {
        if (this.connection && this.connection.readyState !== WebSocket.CLOSED) {
            return;
        }

        this.logger.info('Connecting to websocket server...');

        let connection = new WebSocket(this.url, this.protocols);
        connection.binaryType = 'arraybuffer';

        connection.onopen = () => {
            this.logger.info('Connection established');

            this.resume();
        };

        connection.onclose = (event: CloseEvent) => {
            this.logger.error(`Connection closed, reason: ${event.reason || 'unknown'}`);

            delete this.connection;

            this.resume(new Error(event.reason || 'Unknown error'));
        };

        connection.onmessage = (event: MessageEvent) => {
            this.acknowledge(ab2str(event.data));

            this.resume();
        };

        connection.onerror = (event) => {
            this.logger.error('Connection error, closing...');

            if (connection.readyState !== WebSocket.OPEN) {
                connection.close();
            }
        };

        this.connection = connection;
    }

    close() : void {
        if (!this.connection) {
            return;
        }

        this.connection.onclose = null;
        this.connection.onmessage = null;
        this.connection.onerror = null;
        this.connection.onopen = null;

        delete this.transmission;

        this.connection.close();

        this.logger.info('Disconnected from websocket server.');
    }
}