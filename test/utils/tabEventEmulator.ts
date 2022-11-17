type Listener = (event: Event) => void;

export class TabEventEmulator {
    private tabIndex = 0;

    private readonly listeners: Array<Array<{target: EventTarget, type: string, listener: Listener}>> = [[]];

    private documentAddEventListener?: (...args: any) => void;

    private windowAddEventListener?: (...args: any) => void;

    public registerListeners(): void {
        this.windowAddEventListener = window.addEventListener;

        window.addEventListener = (type: string, listener: Listener): void => {
            this.addEventListener(window, type, listener);
        };

        this.documentAddEventListener = document.addEventListener;

        document.addEventListener = (type: string, listener: Listener): void => {
            this.addEventListener(document, type, listener);
        };
    }

    private addEventListener(target: EventTarget, type: string, listener: Listener): void {
        this.listeners[this.tabIndex].push({target: target, type: type, listener: listener});
    }

    public getTabIndex(): number {
        return this.tabIndex;
    }

    public newTab(): number {
        this.visibilityChanged(false);

        this.listeners.push([]);

        this.tabIndex = this.listeners.length - 1;

        return this.tabIndex;
    }

    public switchTab(tabIndex: number): void {
        if (tabIndex >= this.listeners.length) {
            throw new Error('The tab index does not exist.');
        }

        this.visibilityChanged(false);

        this.tabIndex = tabIndex;

        this.visibilityChanged(true);
    }

    public focus(): void {
        this.dispatchEvent(window, new Event('focus', {bubbles: false, cancelable: false}));
    }

    public blur(): void {
        this.dispatchEvent(window, new Event('blur', {bubbles: false, cancelable: false}));
    }

    public visibilityChanged(visible: boolean): void {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: visible ? 'visible' : 'hidden',
        });

        this.dispatchEvent(document, new Event('visibilitychange', {bubbles: true, cancelable: false}));
    }

    public contentLoaded(): void {
        this.dispatchEvent(window, new Event('DOMContentLoaded', {bubbles: true, cancelable: true}));
    }

    public dispatchEvent(eventTarget: EventTarget, event: Event, tabIndex: number = this.tabIndex): void {
        for (const {target, type, listener} of this.listeners[tabIndex]) {
            if (target === eventTarget && type === event.type) {
                listener.apply(target, [event]);
            }
        }
    }

    public reset(): void {
        if (this.documentAddEventListener !== undefined) {
            document.addEventListener = this.documentAddEventListener;
            delete this.documentAddEventListener;
        }

        if (this.windowAddEventListener !== undefined) {
            window.addEventListener = this.windowAddEventListener;
            delete this.windowAddEventListener;
        }

        this.listeners.splice(0, this.listeners.length, []);
        this.tabIndex = 0;
    }
}
