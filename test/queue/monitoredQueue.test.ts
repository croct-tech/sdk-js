import type {QueueStatus} from '../../src/queue/monitoredQueue';
import {MonitoredQueue} from '../../src/queue/monitoredQueue';
import {InMemoryQueue, CapacityRestrictedQueue} from '../../src/queue';
import {NullLogger} from '../../src/logging';

describe('A monitored queue', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should provide all items', () => {
        const queue = new MonitoredQueue<string>(new InMemoryQueue(), new NullLogger());

        queue.push('foo');
        queue.push('bar');

        expect(queue.all()).toEqual(['foo', 'bar']);
    });

    it('should have a capacity', () => {
        const queue = new MonitoredQueue<string>(new CapacityRestrictedQueue(new InMemoryQueue(), 3), new NullLogger());

        expect(queue.getCapacity()).toBe(3);
    });

    it('should determine whether the queue is empty', () => {
        const queue = new MonitoredQueue<string>(new InMemoryQueue(), new NullLogger());

        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    it('should allow to enqueue new items', () => {
        const queue = new MonitoredQueue<string>(new InMemoryQueue(), new NullLogger());

        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    it('should allow retrieving the item at the beginning of the queue without removing it', () => {
        const queue = new MonitoredQueue<string>(new InMemoryQueue(), new NullLogger());

        queue.push('foo');

        expect(queue.peek()).toBe('foo');
        expect(queue.length()).toBe(1);
    });

    it('should allow removing the item at the beginning of the queue', () => {
        const queue = new MonitoredQueue<string>(new InMemoryQueue(), new NullLogger());

        queue.push('1');
        queue.push('2');
        queue.push('3');

        expect(queue.shift()).toBe('1');
        expect(queue.shift()).toBe('2');
        expect(queue.shift()).toBe('3');
    });

    it('should fail to remove an item if it is empty', () => {
        const queue = new MonitoredQueue<string>(new InMemoryQueue(), new NullLogger());

        function shift(): void {
            queue.shift();
        }

        expect(shift).toThrow();
        expect(shift).toThrow('The queue is empty.');
    });

    it('should provide its length', () => {
        const queue = new MonitoredQueue<string>(new InMemoryQueue(), new NullLogger());

        queue.push('foo');
        queue.push('bar');

        expect(queue.length()).toBe(2);
    });

    it.each([
        [
            'empty',
            [],
        ],
        [
            'almostEmpty',
            ['a'],
        ],
        [
            'halfEmpty',
            ['a'],
        ],
        [
            'halfEmpty',
            ['a', 'b'],
        ],
        [
            'halfEmpty',
            ['a', 'b', 'c'],
        ],
        [
            'halfFull',
            ['a', 'b', 'c', 'd'],
        ],
        [
            'halfFull',
            ['a', 'b', 'c', 'd', 'e'],
        ],
        [
            'almostFull',
            ['a', 'b', 'c', 'd', 'e'],
        ],
        [
            'full',
            ['a', 'b', 'c', 'd', 'e', 'f'],
        ],
    ])('should allow to add a callback to be notified when the queue is %s', (status: QueueStatus, items: string[]) => {
        const queue = new MonitoredQueue<string>(new CapacityRestrictedQueue(new InMemoryQueue(), 6), new NullLogger());
        const callback = jest.fn();

        items.forEach((item: string) => {
            queue.push(item);
        });

        queue.addCallback(status, callback);

        expect(callback).toHaveBeenCalledWith(queue);
    });

    it('should allow to remove a callback', () => {
        const queue = new MonitoredQueue<string>(new CapacityRestrictedQueue(new InMemoryQueue(), 1), new NullLogger());
        const callback = jest.fn();

        queue.addCallback('full', callback);
        queue.push('foo');
        queue.shift();
        queue.removeCallback('full', callback);
        queue.push('bar');

        expect(callback).toHaveBeenCalledWith(queue);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not fail to remove an nonexistent callback', () => {
        const queue = new MonitoredQueue<string>(new CapacityRestrictedQueue(new InMemoryQueue(), 1), new NullLogger());
        const callback = jest.fn();

        queue.removeCallback('full', callback);
        queue.push('foo');

        expect(callback).not.toHaveBeenCalled();
    });
});
