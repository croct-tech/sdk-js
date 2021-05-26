import {NamespacedStorage} from '../src/namespacedStorage';
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
        const innerStorage = new DumbStorage();

        innerStorage.setItem('foo', 'bar');

        const storage = new NamespacedStorage(innerStorage, 'storageName');

        expect(storage.length).toBe(0);

        storage.setItem('foo', 'bar');

        expect(storage.length).toBe(1);

        expect(innerStorage.length).toBe(2);
    });

    test('should allow to remove all items', () => {
        const innerStorage = new DumbStorage();

        innerStorage.setItem('foo', 'bar');

        expect(innerStorage.getItem('foo')).toBe('bar');

        const storage = new NamespacedStorage(innerStorage, 'storageName');

        storage.setItem('foo', 'bar');

        expect(storage.length).toBe(1);

        storage.clear();

        expect(storage.length).toBe(0);

        expect(innerStorage.getItem('foo')).toBe('bar');
    });

    test('should allow to retrieve the value associated with a given key', () => {
        const innerStorage = new DumbStorage();

        innerStorage.setItem('foo', 'inner bar');

        const storage = new NamespacedStorage(innerStorage, 'storageName');

        storage.setItem('foo', 'bar');

        expect(storage.getItem('foo')).toBe('bar');

        expect(innerStorage.getItem('foo')).toBe('inner bar');
    });

    test('should allow to retrieve the value at a given index', () => {
        const innerStorage = new DumbStorage();

        innerStorage.setItem('foo', 'inner bar');

        const storage = new NamespacedStorage(innerStorage, 'storageName');

        storage.setItem('foo', 'bar');

        expect(storage.key(0)).toBe('foo');
        expect(storage.key(1)).toBeNull();

        expect(innerStorage.key(0)).toBe('foo');
        expect(innerStorage.key(1)).toBe('storageName.foo');
        expect(innerStorage.key(2)).toBeNull();
    });

    test('should allow to set a value to a given key', () => {
        const innerStorage = new DumbStorage();

        innerStorage.setItem('foo', 'inner bar');

        const storage = new NamespacedStorage(innerStorage, 'storageName');

        expect(storage.getItem('foo')).toBeNull();

        storage.setItem('foo', 'bar');

        expect(storage.getItem('foo')).toBe('bar');
        expect(innerStorage.getItem('foo')).toBe('inner bar');
    });

    test('should allow to remove an item associated with a given key', () => {
        const innerStorage = new DumbStorage();

        innerStorage.setItem('foo', 'inner bar');

        const storage = new NamespacedStorage(new DumbStorage(), 'storageName');

        storage.setItem('foo', 'bar');

        expect(storage.getItem('foo')).toBe('bar');

        storage.removeItem('foo');

        expect(storage.getItem('foo')).toBeNull();

        expect(innerStorage.getItem('foo')).toBe('inner bar');
    });
});
