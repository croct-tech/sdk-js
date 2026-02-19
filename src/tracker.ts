import type {Logger} from './logging';
import {NullLogger} from './logging';
import type {Tab, TabEvent, TabUrlChangeEvent, TabVisibilityChangeEvent} from './tab';
import type {OutputChannel} from './channel';
import {formatCause} from './error';
import type {Token, TokenProvider} from './token';
import type {RetryPolicy} from './retry';
import type {
    Beacon,
    BeaconPayload,
    PartialTrackingEvent,
    TrackingEvent,
    TrackingEventContext,
} from './trackingEvents';
import {isCartPartialEvent, isIdentifiedUserEvent} from './trackingEvents';

type Options = {
    eventMetadata?: {[key: string]: string},
};

export type TrackOptions = {
    timestamp?: number,
    token?: Token,
};

export type Configuration = Options & {
    channel: OutputChannel<Beacon>,
    logger?: Logger,
    tab: Tab,
    tokenProvider: TokenProvider,
    inactivityRetryPolicy: RetryPolicy<number>,
};

type State = {
    initialized: boolean,
    enabled: boolean,
    suspended: boolean,
};

type InactivityTimer = {
    id?: number,
    since: number,
};

export type QueuedEventInfo<T extends TrackingEvent = TrackingEvent> = Omit<EventInfo<T>, 'status'>;

export type EventInfo<T extends TrackingEvent = TrackingEvent> = {
    context: TrackingEventContext,
    userToken?: Token,
    event: T,
    timestamp: number,
    status: 'pending' | 'confirmed' | 'failed' | 'ignored',
};

export interface EventListener {
    (event: EventInfo): void;
}

const trackedEvents: {[key: string]: {[key: string]: boolean}} = {};

export class Tracker {
    private readonly options: Required<Options>;

    private tab: Tab;

    private tokenProvider: TokenProvider;

    private inactivityRetryPolicy: RetryPolicy<any>;

    private readonly channel: OutputChannel<Beacon>;

    private readonly logger: Logger;

    private readonly listeners: EventListener[] = [];

    private readonly pending: Array<Promise<void>> = [];

    private readonly state: State = {
        enabled: false,
        initialized: false,
        suspended: false,
    };

    private readonly inactivityTimer: InactivityTimer = {
        since: 0,
    };

    public constructor(config: Configuration) {
        const {tab, tokenProvider, channel, logger, inactivityRetryPolicy, ...options} = config;

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
            index = this.listeners.indexOf(listener);
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

    public track<T extends PartialTrackingEvent>(event: T, options: TrackOptions = {}): Promise<T> {
        const {timestamp = Date.now(), token} = options;

        return this.dispatch(this.enrichEvent(event, timestamp), timestamp, token).then(() => event);
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
        this.dispatch(event, timestamp).catch(() => {
            // suppress error
        });
    }

    private notifyEvent(event: EventInfo): void {
        this.listeners.map(listener => listener(event));
    }

    private dispatch<T extends TrackingEvent>(event: T, timestamp: number, token?: Token): Promise<T> {
        const userToken = token ?? this.tokenProvider.getToken();
        const metadata = this.options.eventMetadata;
        const context: TrackingEventContext = {
            tabId: this.tab.id,
            url: this.tab.url,
            ...(Object.keys(metadata).length > 0 ? {metadata: metadata} : {}),
        };

        return this.publish({
            ...(userToken !== null ? {userToken: userToken} : {}),
            event: event,
            timestamp: timestamp,
            context: context,
        });
    }

    private publish<T extends TrackingEvent>(queuedEvent: QueuedEventInfo<T>): Promise<T> {
        const {event} = queuedEvent;

        if (event.type !== 'nothingChanged') {
            this.stopInactivityTimer();
        }

        const eventInfo: EventInfo<T> = {
            ...queuedEvent,
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
            const promise = this.channel
                .publish(this.createBeacon(queuedEvent))
                .then(
                    () => {
                        this.logger.debug(`Successfully published event "${event.type}"`);

                        this.notifyEvent({...eventInfo, status: 'confirmed'});

                        resolve(event);
                    },
                    (cause: Error) => {
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

    private createBeacon({event, timestamp, context, userToken}: QueuedEventInfo): Beacon {
        return {
            timestamp: timestamp,
            ...(userToken !== undefined ? {token: userToken.toString()} : {}),
            context: context,
            payload: this.enrichBeaconPayload(this.createBeaconPayload(event)),
        };
    }

    private createBeaconPayload(event: TrackingEvent): BeaconPayload {
        if (event.type === 'leadGenerated' && event.lead !== undefined) {
            const {lead, ...payload} = event;

            return {
                ...payload,
                patch: {
                    operations: [
                        {
                            type: 'merge',
                            path: '.',
                            value: lead,
                        },
                    ],
                },
            };
        }

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
                            type: 'merge',
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

    private enrichBeaconPayload(event: BeaconPayload): BeaconPayload {
        switch (event.type) {
            case 'linkOpened':
                return {
                    ...event,
                    link: new URL(event.link, this.tab.url).toString(),
                };

            default:
                return event;
        }
    }
}
