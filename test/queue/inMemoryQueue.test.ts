import {InMemoryQueue} from '../../src/queue';

describe('An in-memory queue', () => {
    let queue: InMemoryQueue<string>;

    beforeEach(() => {
        queue = new InMemoryQueue();
    });

    it('should provide all items', () => {
        queue.push('foo');
        queue.push('bar');

        expect(queue.all()).toEqual(['foo', 'bar']);
    });

    it('should have infinity capacity', () => {
        expect(queue.getCapacity()).toEqual(Infinity);
    });

    it('should determine whether the queue is empty', () => {
        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    it('should allow to enqueue new items', () => {
        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    it('should allow retrieving the item at the beginning of the queue without removing it', () => {
        queue.push('foo');

        expect(queue.peek()).toBe('foo');
        expect(queue.length()).toBe(1);
    });

    it('should allow removing the item at the beginning of the queue', () => {
        queue.push('1');
        queue.push('2');
        queue.push('3');

        expect(queue.shift()).toBe('1');
        expect(queue.shift()).toBe('2');
        expect(queue.shift()).toBe('3');
    });

    it('should fail to remove an item if it is empty', () => {
        function shift(): void {
            queue.shift();
        }

        expect(shift).toThrow();
        expect(shift).toThrow('The queue is empty.');
    });

    it('should provide its length', () => {
        queue.push('foo');
        queue.push('bar');

        expect(queue.length()).toBe(2);
    });
});
