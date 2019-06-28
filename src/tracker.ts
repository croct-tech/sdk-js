import {Logger} from './logger';
import {Context} from './context';
import {Recorder} from './recorder';
import {Beacon, OnsitePayload, PageVisibility, PayloadType} from './beacon';
import {Tab, TabEvent} from './tab';
import {OutputChannel} from './channel';
import {NullLogger} from './logger/nullLogger';
import {Token} from './token';

type Options = {
    inactivityInterval?: number
}

type Configuration = Options & {
    context: Context
    channel: OutputChannel<Beacon>,
    logger?: Logger
}

export class Tracker {
    private readonly context: Context;
    private readonly channel: OutputChannel<Beacon>;
    private readonly recorder: Recorder;
    private readonly logger: Logger;
    private readonly options: Required<Options>;
    private initialized: boolean = false;
    private enabled: boolean = false;
    private suspended: boolean = false;
    private inactivityTimer: number;

    constructor({context, channel, logger, ...options}: Configuration) {
        this.context = context;
        this.channel = channel;
        this.recorder = new Recorder(this.logger);
        this.logger = logger || new NullLogger();
        this.options = {
            inactivityInterval: 30 * 1000,
            ...options
        };

        this.trackTabVisibility = this.trackTabVisibility.bind(this);
        this.trackUrlChange = this.trackUrlChange.bind(this);
    }

    isEnabled() {
        return this.enabled;
    }

    enable() {
        if (this.enabled) {
            return;
        }

        this.logger.log('Tracker enabled');

        this.enabled = true;

        if (this.suspended) {
            return;
        }

        if (!this.initialized) {
            this.initialized = true;
            this.initialize();
        }

        this.recorder.start();

        this.startInactivityTimer();

        const tab = this.context.getTab();

        tab.addListener('urlChange', this.trackUrlChange);
        tab.addListener('visibility', this.trackTabVisibility);
    }

    disable() {
        if (!this.enabled) {
            return;
        }

        this.logger.log('Tracker disabled');

        this.enabled = false;

        if (this.suspended) {
            return;
        }

        this.recorder.stop();

        this.stopInactivityTimer();

        const tab = this.context.getTab();

        tab.removeListener('urlChange', this.trackUrlChange);
        tab.removeListener('visibility', this.trackTabVisibility);
    }

    suspend() {
        if (this.suspended) {
            return;
        }

        this.logger.log('Tracker suspended');

        if (this.enabled) {
            this.disable();
            this.enabled = true;
        }

        this.suspended = true;
    }

    unsuspend() {
        if (!this.suspended) {
            return;
        }

        this.logger.log('Tracker unsuspended');

        this.suspended = false;

        if (this.enabled) {
            this.enabled = false;
            this.enable();
        }
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

    hasToken(): boolean {
        return this.getToken() !== null;
    }

    getToken(): Token | null {
        return this.context.getToken();
    }

    private initialize(): void {
        const tab: Tab = this.context.getTab();

        if (tab.isNew) {
            this.track({
                type: PayloadType.TAB_OPENED,
            });
        }

        this.track({
            type: PayloadType.PAGE_OPENED,
            referrer: tab.referrer,
        });

        this.recorder.addListener(event => {
            this.track(event.payload, event.timestamp);
        });
    }

    private trackUrlChange() : void {
        this.track({type: PayloadType.URL_CHANGED});
    }

    private trackTabVisibility(event: TabEvent) : void {
        this.track({
            type: PayloadType.PAGE_VISIBILITY_CHANGED,
            visibility: event.detail.isVisible ?
                PageVisibility.VISIBLE :
                PageVisibility.HIDDEN,
        });
    }

    private trackInactivity() : void {
        this.track({type: PayloadType.NOTHING_CHANGED});
    }

    private stopInactivityTimer() : void {
        window.clearInterval(this.inactivityTimer);

        delete this.inactivityTimer;
    }

    private startInactivityTimer() : void {
        this.inactivityTimer = window.setInterval(
            this.trackInactivity.bind(this),
            this.options.inactivityInterval
        );
    }

    track(payload: OnsitePayload, timestamp: number = Date.now()): void {
        this.stopInactivityTimer();

        this.logger.info(`Tracked beacon "${payload.type}"`);

        const tab = this.context.getTab();

        const promise = this.channel.publish({
            userToken: this.context.getToken(),
            timestamp: timestamp,
            payload: {
                ...payload,
                tabId: tab.id,
                url: tab.location.href,
            },
        });

        promise.then(
            () => this.logger.info(`Sent beacon "${payload.type}"`),
            () => this.logger.info(`Failed to send beacon "${payload.type}"`)
        );

        this.startInactivityTimer();
    }
}

export default Tracker;