export type TabEvent<T = {}> = CustomEvent<{tab: Tab} & T>;
export type TabVisibilityChangeEvent = TabEvent<{visible: boolean}>;
export type TabUrlChangeEvent = TabEvent<{url: string}>;

type TabEventMap = {
    focus: TabEvent,
    blur: TabEvent,
    load: TabEvent,
    unload: TabEvent,
    visibilityChange: TabVisibilityChangeEvent,
    urlChange: TabUrlChangeEvent,
}

interface TabEventListener<T extends keyof TabEventMap> {
    (event: TabEventMap[T]): void;
}

const EventMap: {[key: string]: keyof TabEventMap} = {
    focus: 'focus',
    blur: 'blur',
    beforeunload: 'unload',
    DOMContentLoaded: 'load',
    visibilitychange: 'visibilityChange',
};

function normalizeUri(uri: string): string {
    return window.encodeURI(window.decodeURI(uri));
}

export default class Tab {
    public readonly id: string;

    public readonly isNew: boolean;

    private readonly listeners: Partial<{[key in keyof TabEventMap]: TabEventListener<key>[]}> = {};

    public constructor(id: string, isNew: boolean) {
        this.id = id;
        this.isNew = isNew;

        this.initialize();
    }

    private initialize(): void {
        const listener: EventListener = event => {
            this.emit(EventMap[event.type], new CustomEvent(EventMap[event.type], {detail: {tab: this}}));
        };

        window.addEventListener('focus', listener, true);
        window.addEventListener('blur', listener, true);
        window.addEventListener('beforeunload', listener, true);
        window.addEventListener('DOMContentLoaded', listener, true);

        document.addEventListener(
            'visibilitychange',
            () => {
                this.emit('visibilityChange', new CustomEvent('visibilityChange', {
                    detail: {
                        tab: this,
                        visible: this.isVisible,
                    },
                }));
            },
            true,
        );

        Tab.addUrlChangeListener(url => {
            this.emit('urlChange', new CustomEvent('urlChange', {detail: {tab: this, url: url}}));
        });
    }

    public get location(): Location {
        return window.location;
    }

    public get url(): string {
        return normalizeUri(window.location.href)
    }

    public get title(): string {
        return document.title;
    }

    public get referrer(): string {
        return normalizeUri(document.referrer);
    }

    public get isVisible(): boolean {
        return document.visibilityState === 'visible';
    }

    public get document(): Document {
        return document;
    }

    public addListener<T extends keyof TabEventMap>(type: T, listener: TabEventListener<T>): void {
        if (this.listeners[type] === undefined) {
            this.listeners[type] = [];
        }

        (this.listeners[type] as TabEventListener<T>[]).push(listener);
    }

    public removeListener<T extends keyof TabEventMap>(type: T, listener: TabEventListener<T>): void {
        const listeners = this.listeners[type] as TabEventListener<T>[];

        if (!listeners) {
            return;
        }

        const index = listeners.indexOf(listener);

        if (index >= 0) {
            listeners.splice(index, 1);
        }
    }

    private emit<T extends keyof TabEventMap>(type: T, event: TabEventMap[T]): void {
        const listeners = this.listeners[type] as TabEventListener<T>[];

        if (listeners !== undefined) {
            listeners.forEach(listener => listener(event));
        }
    }

    private static addUrlChangeListener(listener: {(url: string): void}): void {
        let url = window.location.href;

        const updateUrl = (): void => {
            const currentUrl = window.location.href;

            if (url !== currentUrl) {
                listener(normalizeUri(currentUrl));

                url = currentUrl;
            }
        };

        const {pushState} = window.history;

        window.history.pushState = function interceptPushState(...args): any {
            const result = pushState.apply(window.history, args);

            updateUrl();

            return result;
        };

        const {replaceState} = window.history;

        window.history.replaceState = function interceptReplaceState(...args): any {
            const result = replaceState.apply(window.history, args);

            updateUrl();

            return result;
        };

        window.addEventListener('popstate', updateUrl, true);
    }
}
