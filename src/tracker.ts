import Logger from './logger';
import Context from './context';
import Tab, {TabEvent, TabUrlChangeEvent, TabVisibilityChangeEvent} from './tab';
import {OutputChannel} from './channel';
import NullLogger from './logger/nullLogger';
import Token from './token';
import {formatCause} from './error';
import {
    Beacon,
    BeaconPayload,
    Event,
    EventContext,
    isCartPartialEvent,
    isIdentifiedUserEvent,
    PartialEvent,
} from './event';

type Options = {
    inactivityInterval?: number,
    eventMetadata?: {[key: string]: string},
};

export type Configuration = Options & {
    context: Context,
    channel: OutputChannel<Beacon>,
    logger?: Logger,
}

export type EventInfo<T extends Event = Event> = {
    context: EventContext,
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

    private readonly context: Context;

    private readonly channel: OutputChannel<Beacon>;

    private readonly logger: Logger;

    private readonly listeners: EventListener[] = [];

    private initialized = false;

    private enabled = false;

    private suspended = false;

    private readonly pending: Promise<void>[] = [];

    private inactivityTimer: number;

    private inactiveSince: number;

    public constructor(
        {
            context,
            channel,
            logger,
            ...options
        }: Configuration,
    ) {
        this.context = context;
        this.channel = channel;
        this.logger = logger ?? new NullLogger();
        this.options = {
            ...options,
            inactivityInterval: options.inactivityInterval ?? 30 * 1000,
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
        return this.enabled;
    }

    public isSuspended(): boolean {
        return this.suspended;
    }

    public enable(): void {
        if (this.enabled) {
            return;
        }

        this.logger.info('Tracker enabled');

        this.enabled = true;

        if (this.suspended) {
            return;
        }

        this.startInactivityTimer();

        if (!this.initialized) {
            this.initialized = true;
            this.initialize();
        }

        const tab = this.context.getTab();

        tab.addListener('load', this.trackPageLoad);
        tab.addListener('urlChange', this.trackTabUrlChange);
        tab.addListener('visibilityChange', this.trackTabVisibilityChange);
    }

    public disable(): void {
        if (!this.enabled) {
            return;
        }

        this.logger.info('Tracker disabled');

        this.enabled = false;

        if (this.suspended) {
            return;
        }

        const tab = this.context.getTab();

        tab.removeListener('load', this.trackPageLoad);
        tab.removeListener('urlChange', this.trackTabUrlChange);
        tab.removeListener('visibilityChange', this.trackTabVisibilityChange);

        this.stopInactivityTimer();
    }

    public suspend(): void {
        if (this.suspended) {
            return;
        }

        this.logger.info('Tracker suspended');

        if (this.enabled) {
            this.disable();
            this.enabled = true;
        }

        this.suspended = true;
    }

    public unsuspend(): void {
        if (!this.suspended) {
            return;
        }

        this.logger.info('Tracker unsuspended');

        this.suspended = false;

        if (this.enabled) {
            this.enabled = false;
            this.enable();
        }
    }

    public isUserAnonymous(): boolean {
        return this.context.isAnonymous();
    }

    public setToken(token: Token): void {
        const currentToken = this.context.getToken();

        if (currentToken !== null && currentToken.toString() === token.toString()) {
            return;
        }

        const currentSubject = currentToken !== null ? currentToken.getSubject() : null;
        const subject = token.getSubject();

        if (subject === currentSubject) {
            this.context.setToken(token);
        } else {
            if (currentSubject !== null) {
                this.trackUserSignOut({userId: currentSubject});
                this.logger.info('User signed out');
            }

            this.context.setToken(token);

            if (subject !== null) {
                this.trackUserSignIn({userId: subject});
                this.logger.info(`User signed in as ${subject}`);
            }
        }

        this.logger.debug('New token saved');
    }

    public unsetToken(): void {
        const token = this.context.getToken();

        if (token !== null) {
            const subject = token.getSubject();

            if (subject !== null) {
                this.trackUserSignOut({userId: subject});
                this.logger.info('User signed out');
            }

            this.context.setToken(null);

            this.logger.debug('Token removed');
        }
    }

    public hasToken(): boolean {
        return this.getToken() !== null;
    }

    public getToken(): Token | null {
        return this.context.getToken();
    }

    private initialize(): void {
        const tab: Tab = this.context.getTab();

        if (trackedEvents[tab.id] === undefined) {
            trackedEvents[tab.id] = {};
        }

        const initEvents = trackedEvents[tab.id];

        if (tab.isNew && !initEvents.tabOpened) {
            initEvents.tabOpened = true;

            this.trackTabOpen({tabId: tab.id});
        }

        if (!initEvents.pageOpened) {
            initEvents.pageOpened = true;

            this.trackPageOpen({
                url: tab.location.href,
                referrer: tab.referrer,
            });
        }
    }

    private stopInactivityTimer(): void {
        window.clearInterval(this.inactivityTimer);

        delete this.inactivityTimer;
    }

    private startInactivityTimer(): void {
        this.stopInactivityTimer();

        this.inactivityTimer = window.setInterval(this.trackInactivity, this.options.inactivityInterval);
    }

    public track<T extends PartialEvent>(event: T, timestamp: number = Date.now()): Promise<T> {
        return this.publish(this.enrichEvent(event, timestamp), timestamp).then(() => event);
    }

    private trackUserSignIn(payload: {userId: string}): void {
        this.enqueue({
            type: 'userSignedIn',
            ...payload,
        });
    }

    private trackUserSignOut(payload: {userId: string}): void {
        this.enqueue({
            type: 'userSignedOut',
            ...payload,
        });
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
            url: tab.location.href,
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
            sinceTime: this.inactiveSince,
        });
    }

    private enqueue(event: Event, timestamp: number = Date.now()): void {
        this.publish(event, timestamp).catch(() => {
            // suppress error
        });
    }

    private notifyEvent(event: EventInfo): void {
        this.listeners.map(listener => listener(event));
    }

    private publish<T extends Event>(event: T, timestamp: number): Promise<T> {
        this.stopInactivityTimer();

        const tab = this.context.getTab();
        const metadata = this.options.eventMetadata;
        const context: EventContext = {
            tabId: tab.id,
            url: tab.location.href,
            ...(Object.keys(metadata).length > 0 ? {metadata: metadata} : {}),
        };

        const eventInfo: EventInfo<T> = {
            event: event,
            context: context,
            timestamp: timestamp,
            status: 'pending',
        };

        if (this.suspended) {
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

            if (event.type !== 'nothingChanged') {
                this.inactiveSince = Date.now();
            }

            if (this.enabled) {
                this.startInactivityTimer();
            }
        });
    }

    private enrichEvent(event: PartialEvent, timestamp: number): Event {
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

    private createBeacon(event: Event, timestamp: number, context: EventContext): Beacon {
        const token = this.context.getToken();

        return {
            timestamp: timestamp,
            ...(token !== null ? {token: token.toString()} : {}),
            context: context,
            payload: this.createBeaconPayload(event),
        };
    }

    private createBeaconPayload(event: Event): BeaconPayload {
        if (!isIdentifiedUserEvent(event)) {
            return event;
        }

        if (event.type === 'userSignedUp' && typeof event.profile !== 'undefined') {
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
