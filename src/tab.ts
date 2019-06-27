const PREFIX: string = (() => {
    for (let prefix of ['o', 'moz', 'ms', 'webkit']) {
        if ((prefix + 'Hidden') in document) {
            return prefix;
        }
    }

    return '';
})();

const VISIBILITY_EVENT: string = (PREFIX + 'visibilitychange');
const HIDDEN_PROPERTY: keyof Document = (PREFIX === '' ? 'hidden' : PREFIX + 'Hidden') as keyof Document;

export type TabEvent = CustomEvent<Tab>;

type TabEventListener = {
    (event: TabEvent): void;
}

type TabEventType = 'focus' | 'blur' | 'unload' | 'visibility' | 'urlChange';

const EventMap: { [key: string]: TabEventType } = {
    focus: 'focus',
    blur: 'blur',
    beforeunload: 'unload',
    ovisibilitychange: 'visibility',
    mozvisibilitychange: 'visibility',
    msvisibilitychange: 'visibility',
    webkitvisibilitychange: 'visibility',
};

export class Tab {
    public readonly id: string;
    public readonly isNew: boolean;
    private readonly listeners: Partial<{ [key in TabEventType]: TabEventListener[] }> = {};

    constructor(id: string, isNew: boolean) {
        this.id = id;
        this.isNew = isNew;

        this.initialize();
    }

    private initialize(): void {
        const listener: EventListener = event => {
            this.emit(EventMap[event.type]);
        };

        window.addEventListener('focus', listener, true);
        window.addEventListener('blur', listener, true);
        window.addEventListener('beforeunload', listener, true);
        document.addEventListener(VISIBILITY_EVENT, listener, true);

        Tab.addUrlChangeListener(() => this.emit('urlChange'));
    }

    get location(): Location {
        return window.location;
    }

    get referrer(): string {
        return document.referrer;
    }

    get isVisible(): boolean {
        return !document[HIDDEN_PROPERTY];
    }

    addListener(type: TabEventType, listener: TabEventListener) {
        const listeners = this.listeners[type] || [];

        listeners.push(listener);

        this.listeners[type] = listeners;
    }

    removeListener(type: TabEventType, listener: TabEventListener) {
        const listeners = this.listeners[type];

        if (!listeners) {
            return;
        }

        const index = listeners.indexOf(listener);

        if (index >= 0) {
            listeners.splice(index, 1);
        }
    }

    private emit(type: TabEventType) {
        for (const listener of this.listeners[type] || []) {
            listener(new CustomEvent(type, {detail: this}));
        }
    }

    private static addUrlChangeListener(listener: {(): void}) : void {
        let url = window.location.href;

        const updateUrl = function() {
            const currentUrl = window.location.href;

            if (url !== currentUrl) {
                listener();

                url = currentUrl;
            }
        };

        const pushState = window.history.pushState;

        window.history.pushState = function() : any {
            const result = pushState.apply(window.history, arguments);

            updateUrl();

            return result;
        };

        const replaceState = window.history.replaceState;

        window.history.replaceState = function() : any {
            const result = replaceState.apply(window.history, arguments);

            updateUrl();

            return result
        };

        window.addEventListener('popstate', updateUrl, true);
    }
}