import {InMemoryQueue} from '../../src/queue';

describe('An in-memory queue', () => {
    let queue: InMemoryQueue<string>;

    beforeEach(() => {
        queue = new InMemoryQueue();
    });

    test('should provide all items', () => {
        queue.push('foo');
        queue.push('bar');

        expect(queue.all()).toEqual(['foo', 'bar']);
    });

    test('should have infinity capacity', () => {
        expect(queue.getCapacity()).toEqual(Infinity);
    });

    test('should determine whether the queue is empty', () => {
        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    test('should allow to enqueue new items', () => {
        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    test('should allow retrieving the item at the beginning of the queue without removing it', () => {
        queue.push('foo');

        expect(queue.peek()).toBe('foo');
        expect(queue.length()).toBe(1);
    });

    test('should allow removing the item at the beginning of the queue', () => {
        queue.push('1');
        queue.push('2');
        queue.push('3');

        expect(queue.shift()).toBe('1');
        expect(queue.shift()).toBe('2');
        expect(queue.shift()).toBe('3');
    });

    test('should fail to remove an item if it is empty', () => {
        function shift(): void {
            queue.shift();
        }

        expect(shift).toThrow();
        expect(shift).toThrow('The queue is empty.');
    });

    test('should provide its length', () => {
        queue.push('foo');
        queue.push('bar');

        expect(queue.length()).toBe(2);
    });
});
