const PREFIX : string = (() => {
    for (let prefix of ['o', 'moz', 'ms', 'webkit']) {
        if ((prefix + 'Hidden') in document) {
            return prefix;
        }
    }

    return '';
})();

const VISIBILITY_EVENT : string = (PREFIX + 'visibilitychange');
const HIDDEN_PROPERTY : keyof Document = (PREFIX === '' ? 'hidden' : PREFIX + 'Hidden') as keyof Document;

export interface TabEventListener {
    (tab: Tab): void;
}

export enum TabEventType {
    FOCUS = 'active',
    BLUR = 'inactive',
    VISIBLE = 'visible',
    HIDDEN = 'hidden',
    UNLOAD = 'unload',
    WAKEUP = 'wakeup',
    SLEEP = 'sleep',
}

interface EventHandler {
    register() : void;
    unregister() : void;
}

export class Tab {
    private readonly id : string;
    private readonly newTab : boolean;
    private sleeping : boolean = true;
    private readonly handlers: EventHandler[] = Tab.getHandlers(this);
    private readonly listeners: {[type in TabEventType]: TabEventListener[]} = {
        [TabEventType.FOCUS]: [],
        [TabEventType.BLUR]: [],
        [TabEventType.VISIBLE]: [],
        [TabEventType.HIDDEN]: [],
        [TabEventType.UNLOAD]: [],
        [TabEventType.WAKEUP]: [],
        [TabEventType.SLEEP]: [],
    };

    constructor(id: string, isNew: boolean) {
        this.id = id;
        this.newTab = isNew;

        this.wakeup();
    }

    public wakeup() : void {
        if (!this.sleeping) {
            return;
        }

        for (const handler of this.handlers) {
            handler.register();
        }

        this.sleeping = false;

        this.emit(TabEventType.WAKEUP);
    }

    public sleep() {
        if (this.sleeping) {
            return;
        }

        for (const handler of this.handlers) {
            handler.unregister();
        }

        this.sleeping = true;

        this.emit(TabEventType.SLEEP);
    }

    getId() : string {
        return this.id;
    }

    isSleeping() : boolean {
        return this.sleeping;
    }

    isNew() : boolean {
        return this.newTab;
    }

    getUrl() : string {
        return window.location.href;
    }

    isVisible() : boolean {
        return !this.isHidden();
    }

    isHidden() : boolean {
        return document[HIDDEN_PROPERTY] as boolean;
    }

    private emit(type: TabEventType) {
        for (const listener of this.listeners[type]) {
            listener(this);
        }
    }

    onVisible(listener: TabEventListener) {
        this.addListener(TabEventType.VISIBLE, listener);
    }

    onHidden(listener: TabEventListener) {
        this.addListener(TabEventType.HIDDEN, listener);
    }

    onFocus(listener: TabEventListener) {
        this.addListener(TabEventType.FOCUS, listener);
    }

    onBlur(listener: TabEventListener) {
        this.addListener(TabEventType.BLUR, listener);
    }

    onUnload(listener: TabEventListener) {
        this.addListener(TabEventType.UNLOAD, listener);
    }

    onSleep(listener: TabEventListener) {
        this.addListener(TabEventType.SLEEP, listener);
    }

    onWakeup(listener: TabEventListener) {
        this.addListener(TabEventType.WAKEUP, listener);
    }

    addListener(type: TabEventType, listener: TabEventListener) : void {
        this.listeners[type].push(listener);
    }

    removeListener(type: TabEventType, listener: TabEventListener) : void {
        const listeners = this.listeners[type];
        const index = listeners.indexOf(listener);

        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    private static getHandlers(tab: Tab) : EventHandler[] {
        return [
            <EventHandler> {
                emmit(): void {
                    tab.emit(TabEventType.UNLOAD);
                },
                register() : void {
                    window.addEventListener('beforeunload', this.emmit, true);
                },
                unregister() {
                    window.removeEventListener('beforeunload', this.emmit, true);
                }
            },
            <EventHandler> {
                emmit(): void {
                    tab.emit(TabEventType.FOCUS);
                },
                register() : void {
                    window.addEventListener('focus', this.emmit, true);
                },
                unregister() {
                    window.removeEventListener('focus', this.emmit, true);
                }
            },
            <EventHandler> {
                emmit(): void {
                    tab.emit(TabEventType.BLUR);
                },
                register() : void {
                    window.addEventListener('blur', this.emmit, true);
                },
                unregister() {
                    window.removeEventListener('blur', this.emmit, true);
                }
            },
            <EventHandler> {
                emmit(): void {
                    tab.emit(
                        tab.isVisible() ?
                            TabEventType.VISIBLE :
                            TabEventType.HIDDEN
                    );
                },
                register() : void {
                    document.addEventListener(VISIBILITY_EVENT, this.emmit, true);
                },
                unregister() {
                    document.removeEventListener(VISIBILITY_EVENT, this.emmit, true);
                }
            }
        ];
    }
}