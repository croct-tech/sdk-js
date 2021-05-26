import {SynchronousEventManager} from '../src/eventManager';

type TestEventMap = {
    foo: any,
    bar: any,
};

describe('A synchronous event manager', () => {
    test('should dispatch events to subscribed listeners', () => {
        const eventManager = new SynchronousEventManager<TestEventMap>();

        const firstListener = jest.fn();
        const secondListener = jest.fn();

        eventManager.addListener('foo', firstListener);
        eventManager.addListener('foo', secondListener);

        const firstEvent = {};
        eventManager.dispatch('foo', firstEvent);

        eventManager.removeListener('foo', firstListener);

        const secondEvent = {};
        eventManager.dispatch('foo', secondEvent);

        expect(firstListener).toHaveBeenCalledTimes(1);
        expect(secondListener).toHaveBeenCalledTimes(2);

        expect(firstListener).toHaveBeenCalledWith(firstEvent);
        expect(secondListener).toHaveBeenCalledWith(firstEvent);
        expect(secondListener).toHaveBeenCalledWith(secondEvent);
    });

    test('should not fail if no listener is subscribed to a given event', () => {
        const eventManager = new SynchronousEventManager<TestEventMap>();

        const listener = jest.fn();
        eventManager.addListener('foo', listener);

        eventManager.dispatch('bar', {});

        expect(listener).not.toHaveBeenCalled();
    });

    test('should ignore attempts to unsubscribe an non-existing listener', () => {
        const eventManager = new SynchronousEventManager<TestEventMap>();

        expect(() => eventManager.removeListener('foo', jest.fn())).not.toThrow();
    });
});
