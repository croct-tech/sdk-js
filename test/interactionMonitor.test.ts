import {InteractionMonitor} from '../src/interactionMonitor';
import {TabEventEmulator} from './utils/tabEventEmulator';
import type {UserClicked, UserScrolled} from '../src/trackingEvents';

describe('An interaction monitor', () => {
    const tabEventEmulator = new TabEventEmulator();

    beforeEach(() => {
        jest.useFakeTimers();
        tabEventEmulator.registerListeners();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        tabEventEmulator.reset();
    });

    function click(x: number, y: number): void {
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });

        Object.defineProperty(event, 'pageX', {value: x});
        Object.defineProperty(event, 'pageY', {value: y});

        tabEventEmulator.dispatchEvent(window, event);
    }

    function scrollTo(x: number, y: number): void {
        Object.defineProperty(window, 'scrollX', {value: x, configurable: true});
        Object.defineProperty(window, 'scrollY', {value: y, configurable: true});

        tabEventEmulator.dispatchEvent(window, new Event('scroll', {bubbles: true}));
    }

    it('should track a click with correct position and surface size', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor();

        monitor.addListener('userClicked', listener);
        monitor.enable();

        click(100, 200);

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserClicked;

        expect(event.type).toBe('userClicked');
        expect(event.point).toEqual({x: 100, y: 200});

        expect(event.surfaceSize).toEqual({
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
        });

        monitor.disable();
    });

    it('should throttle rapid clicks', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({clickThrottleInterval: 1000});

        monitor.addListener('userClicked', listener);
        monitor.enable();

        jest.spyOn(Date, 'now').mockReturnValue(1000);

        click(10, 20);

        expect(listener).toHaveBeenCalledTimes(1);

        jest.spyOn(Date, 'now').mockReturnValue(1500);

        click(30, 40);

        expect(listener).toHaveBeenCalledTimes(1);

        jest.spyOn(Date, 'now').mockReturnValue(1999);

        click(50, 60);

        expect(listener).toHaveBeenCalledTimes(1);

        monitor.disable();
    });

    it('should allow a click after the throttle interval expires', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({clickThrottleInterval: 1000});

        monitor.addListener('userClicked', listener);
        monitor.enable();

        jest.spyOn(Date, 'now').mockReturnValue(1000);

        click(10, 20);

        expect(listener).toHaveBeenCalledTimes(1);

        jest.spyOn(Date, 'now').mockReturnValue(2000);

        click(30, 40);

        expect(listener).toHaveBeenCalledTimes(2);

        const event = listener.mock.calls[1][0] as UserClicked;

        expect(event.point).toEqual({x: 30, y: 40});

        monitor.disable();
    });

    it('should track a scroll with start and end positions after debounce', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(0, 0);

        jest.advanceTimersByTime(50);

        scrollTo(100, 500);

        jest.advanceTimersByTime(150);

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserScrolled;

        expect(event.type).toBe('userScrolled');
        expect(event.start).toEqual({x: 0, y: 0});
        expect(event.end).toEqual({x: 100, y: 500});

        expect(event.surfaceSize).toEqual({
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
        });

        expect(event.viewportSize).toEqual({
            width: window.innerWidth,
            height: window.innerHeight,
        });

        monitor.disable();
    });

    it('should collapse continuous scrolling into a single event', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(0, 0);

        jest.advanceTimersByTime(50);

        scrollTo(20, 100);

        jest.advanceTimersByTime(50);

        scrollTo(40, 200);

        jest.advanceTimersByTime(50);

        scrollTo(60, 300);

        expect(listener).not.toHaveBeenCalled();

        scrollTo(80, 400);

        jest.advanceTimersByTime(150);

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserScrolled;

        expect(event.start).toEqual({x: 0, y: 0});
        expect(event.end).toEqual({x: 80, y: 400});

        monitor.disable();
    });

    it('should flush the pending scroll when the direction reverses vertically', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(0, 0);
        scrollTo(50, 200);
        scrollTo(100, 500);

        expect(listener).not.toHaveBeenCalled();

        // Reverse vertical direction while continuing horizontally
        scrollTo(150, 300);

        // The downward scroll should have been flushed
        expect(listener).toHaveBeenCalledTimes(1);

        const downEvent = listener.mock.calls[0][0] as UserScrolled;

        expect(downEvent.start).toEqual({x: 0, y: 0});
        expect(downEvent.end).toEqual({x: 150, y: 300});

        // Continue scrolling up
        scrollTo(200, 100);

        jest.advanceTimersByTime(150);

        // The upward scroll should now be flushed by debounce
        expect(listener).toHaveBeenCalledTimes(2);

        const upEvent = listener.mock.calls[1][0] as UserScrolled;

        expect(upEvent.start).toEqual({x: 150, y: 300});
        expect(upEvent.end).toEqual({x: 200, y: 100});

        monitor.disable();
    });

    it('should flush the pending scroll when the direction reverses horizontally', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(0, 0);
        scrollTo(300, 0);

        expect(listener).not.toHaveBeenCalled();

        // Reverse horizontal direction
        scrollTo(100, 0);

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserScrolled;

        expect(event.start).toEqual({x: 0, y: 0});
        expect(event.end).toEqual({x: 100, y: 0});

        jest.advanceTimersByTime(150);

        monitor.disable();
    });

    it('should not emit events when disabled', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor();

        monitor.addListener('userClicked', listener);
        monitor.addListener('userScrolled', listener);

        click(100, 200);
        scrollTo(0, 100);

        jest.advanceTimersByTime(200);

        expect(listener).not.toHaveBeenCalled();
    });

    it('should stop tracking on disable', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor();

        monitor.addListener('userClicked', listener);
        monitor.enable();

        click(100, 200);

        expect(listener).toHaveBeenCalledTimes(1);

        monitor.disable();

        click(300, 400);

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should flush a pending scroll on disable', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(0, 0);
        scrollTo(150, 300);

        expect(listener).not.toHaveBeenCalled();

        monitor.disable();

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserScrolled;

        expect(event.start).toEqual({x: 0, y: 0});
        expect(event.end).toEqual({x: 150, y: 300});
    });

    it('should be idempotent on enable', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor();

        monitor.addListener('userClicked', listener);
        monitor.enable();
        monitor.enable();

        click(100, 200);

        expect(listener).toHaveBeenCalledTimes(1);

        monitor.disable();
    });

    it('should stop notifying a removed listener', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor();

        monitor.addListener('userClicked', listener);
        monitor.enable();

        click(100, 200);

        expect(listener).toHaveBeenCalledTimes(1);

        monitor.removeListener('userClicked', listener);

        click(300, 400);

        expect(listener).toHaveBeenCalledTimes(1);

        monitor.disable();
    });

    it('should be idempotent on disable', () => {
        const monitor = new InteractionMonitor();

        monitor.enable();
        monitor.disable();
        monitor.disable();

        expect(monitor.isEnabled()).toBe(false);
    });
});
