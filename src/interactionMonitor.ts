import type {EventListener} from './eventManager';
import {SynchronousEventManager} from './eventManager';
import type {UserClicked, UserScrolled, Point} from './trackingEvents';

type InteractionEventMap = {
    userClicked: UserClicked,
    userScrolled: UserScrolled,
};

type Options = {
    clickThrottleInterval?: number,
    scrollDebounceInterval?: number,
};

type ScrollState = {
    start: Point,
    lastPosition: Point,
};

export class InteractionMonitor {
    private readonly eventManager = new SynchronousEventManager<InteractionEventMap>();

    private readonly clickThrottleInterval: number;

    private readonly scrollDebounceInterval: number;

    private lastClickTime = 0;

    private scrollState?: ScrollState;

    private scrollDebounceTimer?: number;

    private enabled = false;

    public constructor(options: Options = {}) {
        this.clickThrottleInterval = options.clickThrottleInterval ?? 500;
        this.scrollDebounceInterval = options.scrollDebounceInterval ?? 250;

        this.handleClick = this.handleClick.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
    }

    public addListener<T extends keyof InteractionEventMap>(
        type: T,
        listener: EventListener<InteractionEventMap[T]>,
    ): void {
        this.eventManager.addListener(type, listener);
    }

    public removeListener<T extends keyof InteractionEventMap>(
        type: T,
        listener: EventListener<InteractionEventMap[T]>,
    ): void {
        this.eventManager.removeListener(type, listener);
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public enable(): void {
        if (this.enabled) {
            return;
        }

        this.enabled = true;

        window.addEventListener('click', this.handleClick, true);
        window.addEventListener('scroll', this.handleScroll, true);
    }

    public disable(): void {
        if (!this.enabled) {
            return;
        }

        this.enabled = false;

        window.removeEventListener('click', this.handleClick, true);
        window.removeEventListener('scroll', this.handleScroll, true);

        this.flushPendingScroll();
    }

    private handleClick(event: MouseEvent): void {
        const currentTime = Date.now();

        if (currentTime - this.lastClickTime < this.clickThrottleInterval) {
            return;
        }

        this.lastClickTime = currentTime;

        this.eventManager.dispatch('userClicked', {
            type: 'userClicked',
            point: {
                x: Math.max(0, Math.round(event.pageX)),
                y: Math.max(0, Math.round(event.pageY)),
            },
            surfaceSize: {
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
            },
        });
    }

    private handleScroll(): void {
        const currentPosition: Point = {
            x: Math.max(0, Math.round(window.scrollX)),
            y: Math.max(0, Math.round(window.scrollY)),
        };

        if (this.scrollState === undefined) {
            this.scrollState = {
                start: currentPosition,
                lastPosition: currentPosition,
            };
        } else if (this.hasDirectionChanged(this.scrollState, currentPosition)) {
            const turningPoint = this.scrollState.lastPosition;

            this.flushPendingScroll(turningPoint);

            this.scrollState = {
                start: turningPoint,
                lastPosition: currentPosition,
            };
        } else {
            this.scrollState.lastPosition = currentPosition;
        }

        if (this.scrollDebounceTimer !== undefined) {
            window.clearTimeout(this.scrollDebounceTimer);
        }

        this.scrollDebounceTimer = window.setTimeout(
            () => this.flushPendingScroll(),
            this.scrollDebounceInterval,
        );
    }

    /**
     * Determines whether the scroll direction has reversed on either axis.
     *
     * It compares two vectors:
     * - The scroll direction: the overall direction from start to the previous position (start -> previous)
     * - The movement direction: the direction of the latest movement (previous -> current)
     *
     * A reversal is detected when these two vectors point in opposite directions on the same axis.
     * Axes with no movement (sign = 0) are ignored, so scrolling that simply stops on one axis
     * without reversing does not trigger a flush.
     *
     * Example of vertical reversal:
     *   start = {y: 0}, previous = {y: 500}, current = {y: 400}
     *   scrollDirectionY  = sign(500 - 0)   = +1 (downward)
     *   movementDirectionY = sign(400 - 500) = -1 (upward)
     *   +1 !== -1 => reversed
     *
     * Example of no reversal (same direction):
     *   start = {y: 0}, previous = {y: 200}, current = {y: 500}
     *   scrollDirectionY  = sign(200 - 0)   = +1 (downward)
     *   movementDirectionY = sign(500 - 200) = +1 (downward)
     *   +1 === +1 => not reversed
     *
     * Example of horizontal stop ignored:
     *   start = {x: 0}, previous = {x: 300}, current = {x: 300}
     *   scrollDirectionX  = sign(300 - 0)   = +1
     *   movementDirectionX = sign(300 - 300) = 0 (no movement)
     *   movementDirectionX is 0 => ignored, not a reversal
     */
    private hasDirectionChanged(state: {start: Point, lastPosition: Point}, current: Point): boolean {
        const {start, lastPosition: previous} = state;

        const scrollDirectionX = Math.sign(previous.x - start.x);
        const scrollDirectionY = Math.sign(previous.y - start.y);

        const movementDirectionX = Math.sign(current.x - previous.x);
        const movementDirectionY = Math.sign(current.y - previous.y);

        return (scrollDirectionX !== 0 && movementDirectionX !== 0 && scrollDirectionX !== movementDirectionX)
            || (scrollDirectionY !== 0 && movementDirectionY !== 0 && scrollDirectionY !== movementDirectionY);
    }

    private flushPendingScroll(end?: Point): void {
        if (this.scrollDebounceTimer !== undefined) {
            window.clearTimeout(this.scrollDebounceTimer);
            this.scrollDebounceTimer = undefined;
        }

        if (this.scrollState === undefined) {
            return;
        }

        const {start} = this.scrollState;
        const destination = end ?? {
            x: Math.max(0, Math.round(window.scrollX)),
            y: Math.max(0, Math.round(window.scrollY)),
        };

        this.scrollState = undefined;

        if (start.x === destination.x && start.y === destination.y) {
            return;
        }

        this.eventManager.dispatch('userScrolled', {
            type: 'userScrolled',
            start: start,
            end: destination,
            surfaceSize: {
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
            },
            // Uses clientWidth/clientHeight instead of innerWidth/innerHeight to get the
            // layout viewport size, which remains stable regardless of pinch-to-zoom level
            // on mobile devices.
            viewportSize: {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
            },
        });
    }
}
