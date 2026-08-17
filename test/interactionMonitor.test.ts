import {InteractionMonitor} from '../src/interactionMonitor';
import {TabEventEmulator} from './utils/tabEventEmulator';
import type {UserClicked, UserScrolled} from '../src/trackingEvents';

describe('An interaction monitor', () => {
    const tabEventEmulator = new TabEventEmulator();
    let originalScrollWidth: PropertyDescriptor | undefined;
    let originalScrollHeight: PropertyDescriptor | undefined;

    beforeEach(() => {
        originalScrollWidth = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollWidth');
        originalScrollHeight = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight');

        jest.useFakeTimers();
        tabEventEmulator.registerListeners();
    });

    afterEach(() => {
        if (originalScrollWidth === undefined) {
            Reflect.deleteProperty(document.documentElement, 'scrollWidth');
        } else {
            Object.defineProperty(document.documentElement, 'scrollWidth', originalScrollWidth);
        }

        if (originalScrollHeight === undefined) {
            Reflect.deleteProperty(document.documentElement, 'scrollHeight');
        } else {
            Object.defineProperty(document.documentElement, 'scrollHeight', originalScrollHeight);
        }

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

    function setDocumentDimensions(width: number, height: number): void {
        Object.defineProperties(document.documentElement, {
            scrollWidth: {configurable: true, value: width},
            scrollHeight: {configurable: true, value: height},
        });
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

    it('should clamp negative click coordinates to zero', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor();

        monitor.addListener('userClicked', listener);
        monitor.enable();

        click(-10, -20);

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserClicked;

        expect(event.point).toEqual({x: 0, y: 0});

        monitor.disable();
    });

    it('should clamp negative scroll positions to zero', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(-5, -10);
        scrollTo(100, 200);

        jest.advanceTimersByTime(150);

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserScrolled;

        expect(event.start).toEqual({x: 0, y: 0});
        expect(event.end).toEqual({x: 100, y: 200});

        monitor.disable();
    });

    it('should not emit a scroll event when start and end are the same', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(-5, -10);

        jest.advanceTimersByTime(150);

        expect(listener).not.toHaveBeenCalled();

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
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        });

        monitor.disable();
    });

    it('should discard a pending scroll after document dimensions change', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        setDocumentDimensions(1000, 5000);
        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(0, 4000);
        scrollTo(0, 4500);

        setDocumentDimensions(1000, 800);
        scrollTo(0, 0);
        scrollTo(0, 200);

        jest.advanceTimersByTime(150);

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserScrolled;

        expect(event.start).toEqual({x: 0, y: 0});
        expect(event.end).toEqual({x: 0, y: 200});
        expect(event.surfaceSize).toEqual({width: 1000, height: 800});

        monitor.disable();
    });

    it('should suppress a pending scroll when dimensions change before debounce flush', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        setDocumentDimensions(1000, 5000);
        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(0, 4000);
        scrollTo(0, 4500);

        setDocumentDimensions(1000, 800);

        jest.advanceTimersByTime(150);

        expect(listener).not.toHaveBeenCalled();

        monitor.disable();
    });

    it('should discard a pending scroll and establish a new baseline on resize', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        setDocumentDimensions(1000, 5000);
        monitor.addListener('userScrolled', listener);
        monitor.enable();

        scrollTo(50, 800);
        scrollTo(150, 1600);

        Object.defineProperties(window, {
            scrollX: {configurable: true, value: -10.6},
            scrollY: {configurable: true, value: 200.6},
        });
        setDocumentDimensions(800, 1200);
        tabEventEmulator.dispatchEvent(window, new Event('resize'));

        scrollTo(300.2, 400.8);
        jest.advanceTimersByTime(150);

        expect(listener).toHaveBeenCalledTimes(1);

        const event = listener.mock.calls[0][0] as UserScrolled;

        expect(event.start).toEqual({x: 0, y: 201});
        expect(event.end).toEqual({x: 300, y: 401});
        expect(event.surfaceSize).toEqual({width: 800, height: 1200});

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

        // The completed downward scroll should be flushed immediately
        expect(listener).toHaveBeenCalledTimes(1);

        const downEvent = listener.mock.calls[0][0] as UserScrolled;

        expect(downEvent.start).toEqual({x: 0, y: 0});
        expect(downEvent.end).toEqual({x: 100, y: 500});

        // The reversal is emitted after the debounce
        jest.advanceTimersByTime(150);

        expect(listener).toHaveBeenCalledTimes(2);

        const upEvent = listener.mock.calls[1][0] as UserScrolled;

        expect(upEvent.start).toEqual({x: 100, y: 500});
        expect(upEvent.end).toEqual({x: 150, y: 300});

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

        // The completed rightward scroll should be flushed immediately
        expect(listener).toHaveBeenCalledTimes(1);

        const rightEvent = listener.mock.calls[0][0] as UserScrolled;

        expect(rightEvent.start).toEqual({x: 0, y: 0});
        expect(rightEvent.end).toEqual({x: 300, y: 0});

        // The reversal is emitted after the debounce
        jest.advanceTimersByTime(150);

        expect(listener).toHaveBeenCalledTimes(2);

        const leftEvent = listener.mock.calls[1][0] as UserScrolled;

        expect(leftEvent.start).toEqual({x: 300, y: 0});
        expect(leftEvent.end).toEqual({x: 100, y: 0});

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

    it('should not establish a scroll baseline from a resize after disable', () => {
        const listener = jest.fn();
        const monitor = new InteractionMonitor({scrollDebounceInterval: 150});

        tabEventEmulator.reset();
        monitor.addListener('userScrolled', listener);
        monitor.enable();
        monitor.disable();

        Object.defineProperties(window, {
            scrollX: {configurable: true, value: 100},
            scrollY: {configurable: true, value: 200},
        });
        window.dispatchEvent(new Event('resize'));

        monitor.enable();

        Object.defineProperties(window, {
            scrollX: {configurable: true, value: 300},
            scrollY: {configurable: true, value: 400},
        });
        window.dispatchEvent(new Event('scroll'));
        jest.advanceTimersByTime(150);

        expect(listener).not.toHaveBeenCalled();

        monitor.disable();
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
