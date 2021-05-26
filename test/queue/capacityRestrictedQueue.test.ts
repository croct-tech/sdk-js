import {CapacityRestrictedQueue, InMemoryQueue} from '../../src/queue';

describe('A capacity-restricted queue', () => {
    test('should provide all items', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        queue.push('foo');
        queue.push('bar');

        expect(queue.all()).toEqual(['foo', 'bar']);
    });

    test('should have predefined capacity', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        expect(queue.getCapacity()).toBe(3);
    });

    test('should determine whether the queue is empty', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    test('should allow to enqueue new items', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    test('should not allow to enqueue new items after the maximum capacity is reached', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 1);

        queue.push('foo');

        function push(): void {
            queue.push('bar');
        }

        expect(push).toThrow(Error);
        expect(push).toThrow('Maximum queue capacity reached.');
    });

    test('should allow retrieving the item at the beginning of the queue without removing it', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        queue.push('foo');

        expect(queue.peek()).toBe('foo');
        expect(queue.length()).toBe(1);
    });

    test('should allow removing the item at the beginning of the queue', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        queue.push('1');
        queue.push('2');
        queue.push('3');

        expect(queue.shift()).toBe('1');
        expect(queue.shift()).toBe('2');
        expect(queue.shift()).toBe('3');
    });

    test('should fail to remove an item if it is empty', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        function shift(): void {
            queue.shift();
        }

        expect(shift).toThrow(Error);
        expect(shift).toThrow('The queue is empty.');
    });

    test('should provide its length', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        queue.push('foo');
        queue.push('bar');

        expect(queue.length()).toBe(2);
    });
});
