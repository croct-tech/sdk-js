import {Logger} from './logger';
import {Context} from './context';
import {Recorder} from './recorder';
import {Beacon, PartialPayload} from './beacon';
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
        this.logger = logger || new NullLogger();
        this.recorder = new Recorder(this.logger);
        this.options = {
            inactivityInterval: 30 * 1000,
            ...options
        };

        this.trackTabVisibility = this.trackTabVisibility.bind(this);
        this.trackUrlChange = this.trackUrlChange.bind(this);
        this.trackInactivity = this.trackInactivity.bind(this);
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

        this.startInactivityTimer();

        if (!this.initialized) {
            this.initialized = true;
            this.initialize();
        }

        this.recorder.start();

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

        const tab = this.context.getTab();

        tab.removeListener('urlChange', this.trackUrlChange);
        tab.removeListener('visibility', this.trackTabVisibility);

        this.stopInactivityTimer();
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
                type: 'tabOpened',
            });
        }

        this.track({
            type: 'pageOpened',
            referrer: tab.referrer,
        });

        this.recorder.addListener(event => {
            this.track(event.payload, event.timestamp);
        });
    }

    private trackUrlChange() : void {
        this.track({type: 'urlChanged'});
    }

    private trackTabVisibility(event: TabEvent) : void {
        this.track({
            type: 'pageVisibilityChanged',
            visibility: event.detail.isVisible ? 'visible' : 'hidden'
        });
    }

    private trackInactivity() : void {
        this.track({type: 'nothingChanged'});
    }

    private stopInactivityTimer() : void {
        window.clearInterval(this.inactivityTimer);

        const a = delete this.inactivityTimer;
    }

    private startInactivityTimer() : void {
        this.stopInactivityTimer();

        if (this.suspended) {
            return;
        }

        this.inactivityTimer = window.setInterval(
            this.trackInactivity,
            this.options.inactivityInterval
        );
    }

    track(payload: PartialPayload, timestamp: number = Date.now()): void {
        this.stopInactivityTimer();

        if (this.suspended) {
            this.logger.info(`Tracker is suspended, ignoring beacon "${payload.type}"`);

            return;
        }

        this.logger.info(`Tracked beacon "${payload.type}"`);

        const tab = this.context.getTab();

        const promise = this.channel.publish({
            userToken: this.context.getToken(),
            timestamp: timestamp,
            payload: {
                tabId: tab.id,
                url: tab.location.href,
                ...payload,
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