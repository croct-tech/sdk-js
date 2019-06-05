import {Logger} from "./logging";
import {Token} from "./token";
import {Context} from "./context";
import Recorder, {RecorderEvent} from "./recorder";
import {Beacon, PayloadType} from "./beacon";
import {Tab} from "./tab";
import {BeaconPromise, BeaconTransport} from "./transport";
import {BeaconQueue} from "./queue";

class Tracker {
    private readonly context: Context;
    private readonly transport: BeaconTransport;
    private readonly queue: BeaconQueue;
    private readonly logger: Logger;
    private readonly recorder: Recorder;
    private readonly maxQueueLength: number;
    private readonly underrunThreshold: number;
    private initialized: boolean = false;
    private enabled: boolean = false;
    private promise: BeaconPromise | undefined;

    constructor(
        context: Context,
        transport: BeaconTransport,
        queue: BeaconQueue,
        maxQueueLength: number,
        underrunThreshold: number,
        logger: Logger
    ) {
        this.context = context;
        this.transport = transport;
        this.queue = queue;
        this.maxQueueLength = maxQueueLength;
        this.underrunThreshold = underrunThreshold;
        this.logger = logger;
        this.recorder = new Recorder(logger);
    }

    isEnabled() {
        return this.enabled;
    }

    enable() {
        if (this.isEnabled()) {
            return;
        }

        this.enabled = true;

        this.logger.log('Tracker enabled');

        this.initialize();

        this.recorder.start();

        this.flush();
    }

    disable() {
        if (!this.isEnabled()) {
            return;
        }

        this.enabled = false;

        this.recorder.stop();

        this.logger.log('Tracker disabled');
    }

    private initialize() {
        const tab: Tab = this.context.getCurrentTab();

        if (tab.isNew()) {
            this.send({
                userToken: this.context.getToken(),
                timestamp: Date.now(),
                payload: {
                    type: PayloadType.TAB_OPENED,
                    tabId: tab.getId(),
                    url: tab.getUrl(),
                }
            })
        }

        this.send({
            userToken: this.context.getToken(),
            timestamp: Date.now(),
            payload: {
                type: PayloadType.PAGE_OPENED,
                tabId: tab.getId(),
                url: tab.getUrl(),
            }
        });

        this.recorder.registerListener((event) => this.handle(event));

        this.initialized = true;
    }

    identify(userId: string) {
        if (userId === '') {
            throw new Error('The user ID cannot be empty');
        }

        this.logger.log(`User identified: ${userId}`);

        this.context.setToken(new Token(userId, Date.now()));
    }

    anonymize() {
        this.logger.log('User anonymized');

        this.context.setToken(null);
    }

    hasToken() : boolean {
        return this.getToken() !== null;
    }

    getToken() : Token | null {
        return this.context.getToken();
    }

    private handle(event: RecorderEvent) : void {
        const tab = this.context.getCurrentTab();

        this.send({
            userToken: this.context.getToken(),
            timestamp: event.timestamp,
            payload: {
                tabId: tab.getId(),
                url: tab.getUrl(),
                ...event.payload
            }
        });
    }

    private send(beacon: Beacon) : void {
        this.enqueue(beacon);
        this.flush();
    }

    private enqueue(beacon: Beacon) : void {
        if (this.queue.length() >= this.maxQueueLength) {
            this.recorder.stop();

            return;
        }

        this.queue.push(beacon);
    }

    private dequeue() : void {
        this.queue.shift();

        const minCapacity = this.maxQueueLength * this.underrunThreshold;

        if (this.isEnabled() && this.queue.length() <= minCapacity) {
            this.recorder.start();
        }
    }

    private flush() : void {
        if (this.promise) {
            return;
        }

        const beacon = this.queue.peek();

        if (beacon === null) {
            return;
        }

        this.promise = this.transport.send(beacon);

        this.promise.finally(() => {
            delete this.promise;

            this.dequeue();
            this.flush();
        });
    }
}

export default Tracker;