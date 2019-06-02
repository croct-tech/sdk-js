import {Logger} from "./logging";
import {Token} from "./token";
import {Context} from "./context";
import Recorder, {RecorderEvent} from "./recorder";
import {Beacon, PayloadType} from "./beacon";
import {Tab} from "./tab";

class Tracker {
    private readonly context: Context;
    private readonly recorder: Recorder;
    private readonly logger: Logger;
    private initialized: boolean = false;

    constructor(context: Context, logger: Logger) {
        this.context = context;
        this.recorder = new Recorder(logger);
        this.logger = logger;
    }

    isEnabled() {
        return this.recorder.isRecording();
    }

    enable() {
        if (this.isEnabled()) {
            return;
        }

        this.logger.log('Tracker enabled');

        this.initialize();

        this.recorder.start();
    }

    disable() {
        if (!this.isEnabled()) {
            return;
        }

        this.recorder.stop();

        this.logger.log('Tracker disabled');
    }

    private initialize() {
        const tab: Tab = this.context.getCurrentTab();

        if (tab.isNew()) {
            this.send({
                userToken: this.context.getToken(),
                timestamp: Date.now(),
                tenantId: 'tenant_id',
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
            tenantId: 'tenant_id',
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
        const beacon : Beacon = {
            userToken: this.context.getToken(),
            timestamp: event.timestamp,
            tenantId: 'tenant_id',
            payload: {
                tabId: tab.getId(),
                url: tab.getUrl(),
                ...event.payload
            }
        };

        this.send(beacon);
    }

    private send(beacon: Beacon) : void {
        console.log(beacon);
    }

}

export default Tracker;