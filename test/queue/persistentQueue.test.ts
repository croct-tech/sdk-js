import {PersistentQueue} from '../../src/queue';
import {DumbStorage} from '../utils/dumbStorage';

describe('A persistent queue', () => {
    it('should provide all items', () => {
        const queue = new PersistentQueue<string>(new DumbStorage());

        queue.push('foo');
        queue.push('bar');

        expect(queue.all()).toEqual(['foo', 'bar']);
    });

    it('should have unlimited capacity', () => {
        const queue = new PersistentQueue<string>(new DumbStorage());

        expect(queue.getCapacity()).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should determine whether the queue is empty', () => {
        const queue = new PersistentQueue<string>(new DumbStorage());

        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    it('should allow to enqueue new items', () => {
        const queue = new PersistentQueue<string>(new DumbStorage());

        expect(queue.isEmpty()).toBeTruthy();

        queue.push('foo');

        expect(queue.isEmpty()).toBeFalsy();
    });

    it('should allow retrieving the item at the beginning of the queue without removing it', () => {
        const queue = new PersistentQueue<string>(new DumbStorage());

        queue.push('foo');

        expect(queue.peek()).toBe('foo');
        expect(queue.length()).toBe(1);
    });

    it('should consider non-existent values as null', () => {
        const queue = new PersistentQueue<string>(new DumbStorage(true));

        expect(queue.peek()).toBeNull();
    });

    it('should allow removing the item at the beginning of the queue', () => {
        const queue = new PersistentQueue<string>(new DumbStorage());

        queue.push('1');
        queue.push('2');
        queue.push('3');

        expect(queue.shift()).toBe('1');
        expect(queue.shift()).toBe('2');
        expect(queue.shift()).toBe('3');
    });

    it('should fail to shift if it is empty', () => {
        const queue = new PersistentQueue<string>(new DumbStorage());

        function shift(): void {
            queue.shift();
        }

        expect(shift).toThrow();
        expect(shift).toThrow('The queue is empty.');
    });

    it('should provide the number of items', () => {
        const queue = new PersistentQueue<string>(new DumbStorage());

        queue.push('foo');
        queue.push('bar');

        expect(queue.length()).toBe(2);
    });
});
