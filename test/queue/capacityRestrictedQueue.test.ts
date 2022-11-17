import {CapacityRestrictedQueue, InMemoryQueue} from '../../src/queue';

describe('A capacity-restricted queue', () => {
    it('should provide all items', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        queue.push('foo');
        queue.push('bar');

        expect(queue.all()).toEqual(['foo', 'bar']);
    });

    it('should have predefined capacity', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        expect(queue.getCapacity()).toBe(3);
    });

    it('should determine whether the queue is empty', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    it('should allow to enqueue new items', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    it('should not allow to enqueue new items after the maximum capacity is reached', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 1);

        queue.push('foo');

        function push(): void {
            queue.push('bar');
        }

        expect(push).toThrow();
        expect(push).toThrow('Maximum queue capacity reached.');
    });

    it('should allow retrieving the item at the beginning of the queue without removing it', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        queue.push('foo');

        expect(queue.peek()).toBe('foo');
        expect(queue.length()).toBe(1);
    });

    it('should allow removing the item at the beginning of the queue', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        queue.push('1');
        queue.push('2');
        queue.push('3');

        expect(queue.shift()).toBe('1');
        expect(queue.shift()).toBe('2');
        expect(queue.shift()).toBe('3');
    });

    it('should fail to remove an item if it is empty', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        function shift(): void {
            queue.shift();
        }

        expect(shift).toThrow();
        expect(shift).toThrow('The queue is empty.');
    });

    it('should provide its length', () => {
        const queue = new CapacityRestrictedQueue<string>(new InMemoryQueue(), 3);

        queue.push('foo');
        queue.push('bar');

        expect(queue.length()).toBe(2);
    });
});
