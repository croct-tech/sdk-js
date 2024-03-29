export interface EventListener<T> {
    (event: T): void;
}

export type EventMap = Record<string, Record<string, any>>;

export interface EventDispatcher<TEvents extends EventMap> {
    dispatch<T extends keyof TEvents>(eventName: T, event: TEvents[T]): void;
}

export interface EventSubscriber<TEvents extends EventMap> {
    addListener<T extends keyof TEvents>(eventName: T, listener: EventListener<TEvents[T]>): void;

    removeListener<T extends keyof TEvents>(eventName: T, listener: EventListener<TEvents[T]>): void;
}

export interface EventManager<DEvents extends EventMap, SEvents extends EventMap = DEvents>
    extends EventDispatcher<DEvents>, EventSubscriber<SEvents> {
}

export class SynchronousEventManager<TEvents extends EventMap> implements EventManager<TEvents> {
    private readonly listeners: {[type in keyof TEvents]?: Array<EventListener<TEvents[type]>>} = {};

    public addListener<T extends keyof TEvents>(type: T, listener: EventListener<TEvents[T]>): void {
        const listeners: Array<EventListener<TEvents[T]>> = this.listeners[type] ?? [];

        listeners.push(listener);

        this.listeners[type] = listeners;
    }

    public removeListener<T extends keyof TEvents>(eventName: T, listener: EventListener<TEvents[T]>): void {
        const listeners = this.listeners[eventName];

        if (listeners === undefined) {
            return;
        }

        const index = listeners.indexOf(listener);

        if (index >= 0) {
            listeners.splice(index, 1);
        }
    }

    public dispatch<T extends keyof TEvents>(eventName: T, event: TEvents[T]): void {
        const listeners = this.listeners[eventName];

        if (listeners !== undefined) {
            listeners.forEach(listener => listener(event));
        }
    }
}
