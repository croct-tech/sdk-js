import {Logger} from './logging';
import Tab, {TabEvent, TabUrlChangeEvent, TabVisibilityChangeEvent} from './tab';
import {OutputChannel} from './channel';
import NullLogger from './logging/nullLogger';
import {formatCause} from './error';
import {
    Beacon,
    BeaconPayload,
    TrackingEvent,
    TrackingEventContext,
    isCartPartialEvent,
    isIdentifiedUserEvent,
    PartialTrackingEvent,
} from './trackingEvents';
import {TokenProvider} from './token';
import {RetryPolicy} from './retry';

type Options = {
    eventMetadata?: {[key: string]: string},
};

export type Configuration = Options & {
    channel: OutputChannel<Beacon>,
    logger?: Logger,
    tab: Tab,
    tokenProvider: TokenProvider,
    inactivityRetryPolicy: RetryPolicy<number>,
}

type State = {
    initialized: boolean,
    enabled: boolean,
    suspended: boolean,
}

type InactivityTimer = {
    id?: number,
    since: number,
}

export type EventInfo<T extends TrackingEvent = TrackingEvent> = {
    context: TrackingEventContext,
    event: T,
    timestamp: number,
    status: 'pending' | 'confirmed' | 'failed' | 'ignored',
}

export interface EventListener {
    (event: EventInfo): void;
}

const trackedEvents: {[key: string]: {[key: string]: boolean}} = {};

export default class Tracker {
    private readonly options: Required<Options>;

    private tab: Tab;

    private tokenProvider: TokenProvider;

    private inactivityRetryPolicy: RetryPolicy<any>;

    private readonly channel: OutputChannel<Beacon>;

    private readonly logger: Logger;

    private readonly listeners: EventListener[] = [];

    private readonly pending: Promise<void>[] = [];

    private readonly state: State = {
        enabled: false,
        initialized: false,
        suspended: false,
    };

    private readonly inactivityTimer: InactivityTimer = {
        since: 0,
    };

    public constructor({tab, tokenProvider, channel, logger, inactivityRetryPolicy, ...options}: Configuration) {
        this.tab = tab;
        this.tokenProvider = tokenProvider;
        this.inactivityRetryPolicy = inactivityRetryPolicy;
        this.channel = channel;
        this.logger = logger ?? new NullLogger();
        this.options = {
            ...options,
            eventMetadata: options.eventMetadata ?? {},
        };

        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
        this.suspend = this.suspend.bind(this);
        this.unsuspend = this.unsuspend.bind(this);
        this.trackPageLoad = this.trackPageLoad.bind(this);
        this.trackTabVisibilityChange = this.trackTabVisibilityChange.bind(this);
        this.trackTabUrlChange = this.trackTabUrlChange.bind(this);
        this.trackInactivity = this.trackInactivity.bind(this);
    }

    public addListener(listener: EventListener): void {
        this.listeners.push(listener);
    }

    public removeListener(listener: EventListener): void {
        let index = this.listeners.indexOf(listener);

        while (index >= 0) {
            this.listeners.splice(index, 1);
            index = this.listeners.indexOf(listener)
        }
    }

    public get flushed(): Promise<void> {
        const suppress = (): void => {
            // suppress errors
        };

        return Promise.all(this.pending).then(suppress, suppress);
    }

    public isEnabled(): boolean {
        return this.state.enabled;
    }

    public isSuspended(): boolean {
        return this.state.suspended;
    }

    public enable(): void {
        if (this.state.enabled) {
            return;
        }

        this.logger.info('Tracker enabled');

        this.state.enabled = true;

        if (this.state.suspended) {
            return;
        }

        this.startInactivityTimer();

        if (!this.state.initialized) {
            this.state.initialized = true;
            this.initialize();
        }

        this.tab.addListener('load', this.trackPageLoad);
        this.tab.addListener('urlChange', this.trackTabUrlChange);
        this.tab.addListener('visibilityChange', this.trackTabVisibilityChange);
    }

    public disable(): void {
        if (!this.state.enabled) {
            return;
        }

        this.logger.info('Tracker disabled');

        this.state.enabled = false;

        if (this.state.suspended) {
            return;
        }

        this.tab.removeListener('load', this.trackPageLoad);
        this.tab.removeListener('urlChange', this.trackTabUrlChange);
        this.tab.removeListener('visibilityChange', this.trackTabVisibilityChange);

        this.stopInactivityTimer();
    }

    public suspend(): void {
        if (this.state.suspended) {
            return;
        }

        this.logger.info('Tracker suspended');

        if (this.state.enabled) {
            this.disable();
            this.state.enabled = true;
        }

        this.state.suspended = true;
    }

    public unsuspend(): void {
        if (!this.state.suspended) {
            return;
        }

        this.logger.info('Tracker unsuspended');

        this.state.suspended = false;

        if (this.state.enabled) {
            this.state.enabled = false;
            this.enable();
        }
    }

    private initialize(): void {
        if (trackedEvents[this.tab.id] === undefined) {
            trackedEvents[this.tab.id] = {};
        }

        const initEvents = trackedEvents[this.tab.id];

        if (this.tab.isNew && !initEvents.tabOpened) {
            initEvents.tabOpened = true;

            this.trackTabOpen({tabId: this.tab.id});
        }

        if (!initEvents.pageOpened) {
            initEvents.pageOpened = true;

            this.trackPageOpen({
                url: this.tab.url,
                referrer: this.tab.referrer,
            });
        }
    }

    private stopInactivityTimer(): void {
        if (this.inactivityTimer.id !== undefined) {
            window.clearTimeout(this.inactivityTimer.id);

            delete this.inactivityTimer.id;
        }
    }

    private startInactivityTimer(): void {
        this.stopInactivityTimer();

        this.inactivityTimer.since = Date.now();

        let iteration = -1;

        const startTimer = (): void => {
            if (!this.inactivityRetryPolicy.shouldRetry(iteration + 1, this.inactivityTimer.since)) {
                window.clearTimeout(this.inactivityTimer.id);

                return;
            }

            iteration += 1;

            this.inactivityTimer.id = window.setTimeout(
                () => {
                    this.trackInactivity();
                    startTimer();
                },
                this.inactivityRetryPolicy.getDelay(iteration),
            );
        };

        startTimer();
    }

    public track<T extends PartialTrackingEvent>(event: T, timestamp: number = Date.now()): Promise<T> {
        return this.publish(this.enrichEvent(event, timestamp), timestamp).then(() => event);
    }

    private trackPageOpen({referrer, ...payload}: {url: string, referrer: string}): void {
        this.enqueue({
            type: 'pageOpened',
            ...payload,
            ...(referrer.length > 0 ? {referrer: referrer} : {}),
        });
    }

    private trackPageLoad({detail: {tab}}: TabEvent): void {
        this.enqueue({
            type: 'pageLoaded',
            url: tab.url,
            title: tab.title,
            lastModifiedTime: Date.parse(tab.document.lastModified),
        });
    }

    private trackTabOpen(payload: {tabId: string}): void {
        this.enqueue({
            type: 'tabOpened',
            ...payload,
        });
    }

    private trackTabUrlChange({detail}: TabUrlChangeEvent): void {
        this.enqueue({
            type: 'tabUrlChanged',
            tabId: detail.tab.id,
            url: detail.url,
        });
    }

    private trackTabVisibilityChange({detail}: TabVisibilityChangeEvent): void {
        this.enqueue({
            type: 'tabVisibilityChanged',
            tabId: detail.tab.id,
            visibility: detail.visible ? 'visible' : 'hidden',
        });
    }

    private trackInactivity(): void {
        this.enqueue({
            type: 'nothingChanged',
            sinceTime: this.inactivityTimer.since,
        });
    }

    private enqueue(event: TrackingEvent, timestamp: number = Date.now()): void {
        this.publish(event, timestamp).catch(() => {
            // suppress error
        });
    }

    private notifyEvent(event: EventInfo): void {
        this.listeners.map(listener => listener(event));
    }

    private publish<T extends TrackingEvent>(event: T, timestamp: number): Promise<T> {
        if (event.type !== 'nothingChanged') {
            this.stopInactivityTimer();
        }

        const metadata = this.options.eventMetadata;
        const context: TrackingEventContext = {
            tabId: this.tab.id,
            url: this.tab.url,
            ...(Object.keys(metadata).length > 0 ? {metadata: metadata} : {}),
        };

        const eventInfo: EventInfo<T> = {
            event: event,
            context: context,
            timestamp: timestamp,
            status: 'pending',
        };

        if (this.state.suspended) {
            this.logger.warn(`Tracker is suspended, ignoring event "${event.type}"`);

            this.notifyEvent({...eventInfo, status: 'ignored'});

            return Promise.reject(new Error('The tracker is suspended.'));
        }

        this.logger.info(`Tracked event "${event.type}"`);

        this.notifyEvent(eventInfo);

        return new Promise<T>((resolve, reject) => {
            const promise = this.channel.publish(this.createBeacon(event, timestamp, context)).then(
                () => {
                    this.logger.debug(`Successfully published event "${event.type}"`);

                    this.notifyEvent({...eventInfo, status: 'confirmed'});

                    resolve(event);
                },
                cause => {
                    this.logger.error(`Failed to publish event "${event.type}", reason: ${formatCause(cause)}`);

                    this.notifyEvent({...eventInfo, status: 'failed'});

                    reject(cause);
                },
            );

            this.pending.push(promise);

            promise.finally(() => {
                this.pending.splice(this.pending.indexOf(promise), 1);
            });

            if (this.state.enabled && event.type !== 'nothingChanged') {
                this.startInactivityTimer();
            }
        });
    }

    private enrichEvent(event: PartialTrackingEvent, timestamp: number): TrackingEvent {
        if (isCartPartialEvent(event)) {
            const {cart: {lastUpdateTime = timestamp, ...cart}, ...payload} = event;

            return {
                ...payload,
                cart: {
                    ...cart,
                    lastUpdateTime: lastUpdateTime,
                },
            };
        }

        return event;
    }

    private createBeacon(event: TrackingEvent, timestamp: number, context: TrackingEventContext): Beacon {
        const token = this.tokenProvider.getToken();

        return {
            timestamp: timestamp,
            ...(token !== null ? {token: token.toString()} : {}),
            context: context,
            payload: this.createBeaconPayload(event),
        };
    }

    private createBeaconPayload(event: TrackingEvent): BeaconPayload {
        if (!isIdentifiedUserEvent(event)) {
            return event;
        }

        if (event.type === 'userSignedUp' && event.profile !== undefined) {
            const {userId, profile, ...payload} = event;

            return {
                ...payload,
                externalUserId: userId,
                patch: {
                    operations: [
                        {
                            type: 'set',
                            path: '.',
                            value: profile,
                        },
                    ],
                },
            };
        }

        const {userId, ...payload} = event;

        return {
            ...payload,
            externalUserId: userId,
        };
    }
}
