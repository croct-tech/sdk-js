import NamespacedStorage from '../src/namespacedStorage';
import {DumbStorage} from './utils/dumbStorage';

describe('A namespaced storage', () => {
    test('should not allow an empty namespace', () => {
        function invalidToken(): NamespacedStorage {
            return new NamespacedStorage(new DumbStorage(), '');
        }

        expect(invalidToken).toThrow(Error);
        expect(invalidToken).toThrow('The namespace cannot be empty.');
    });

    test('should provide the number of stored items', () => {
        const storage = new NamespacedStorage(new DumbStorage(), 'storageName');

        expect(storage.length).toBe(0);

        storage.setItem('foo', 'bar');

        expect(storage.length).toBe(1);
    });

    test('should allow to remove all items', () => {
        const storage = new NamespacedStorage(new DumbStorage(), 'storageName');

        storage.setItem('foo', 'bar');

        expect(storage.length).toBe(1);

        storage.clear();

        expect(storage.length).toBe(0);
    });

    test('should allow to retrieve the value associated with a given key', () => {
        const storage = new NamespacedStorage(new DumbStorage(), 'storageName');

        storage.setItem('foo', 'bar');

        expect(storage.getItem('foo')).toBe('bar');
    });

    test('should allow to retrieve the value at a given index', () => {
        const storage = new NamespacedStorage(new DumbStorage(), 'storageName');

        storage.setItem('foo', 'bar');

        expect(storage.key(0)).toBe('foo');
        expect(storage.key(1)).toBeNull();
    });

    test('should allow to set a value to a given key', () => {
        const storage = new NamespacedStorage(new DumbStorage(), 'storageName');

        expect(storage.getItem('foo')).toBeNull();

        storage.setItem('foo', 'bar');

        expect(storage.getItem('foo')).toBe('bar');
    });

    test('should allow to remove an item associated with a given key', () => {
        const storage = new NamespacedStorage(new DumbStorage(), 'storageName');

        storage.setItem('foo', 'bar');

        expect(storage.getItem('foo')).toBe('bar');

        storage.removeItem('foo');

        expect(storage.getItem('foo')).toBeNull();
    });
});
