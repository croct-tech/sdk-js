import {LocalStorageCache} from '../../src/cache';

describe('A storage cache', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('should cache data into the provided storage', async () => {
        const cache = new LocalStorageCache(localStorage, 'key');

        expect(localStorage.getItem('key')).toBeNull();
        expect(cache.get()).toBeNull();

        cache.put('foo');

        expect(localStorage.getItem('key')).toBe('foo');
        expect(cache.get()).toBe('foo');

        cache.clear();

        expect(localStorage.getItem('key')).toBeNull();
        expect(cache.get()).toBeNull();
    });

    test('should allow ot subscribe and unsubscribe listeners to get notified about changes to the cache', async () => {
        const cache = new LocalStorageCache(localStorage, 'key');
        const listener = jest.fn();

        cache.addListener(listener);

        // Put twice to ensure the listener will be called only once
        cache.put('foo');
        cache.put('foo');
        cache.clear();

        cache.removeListener(listener);

        cache.put('bar');

        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenNthCalledWith(1, 'foo');
        expect(listener).toHaveBeenNthCalledWith(2, null);
    });

    test('should ensure consistency against external changes', async () => {
        const cache = new LocalStorageCache(localStorage, 'key');

        cache.put('foo');

        expect(cache.get()).toBe('foo');

        localStorage.setItem('key', 'bar');

        expect(cache.get()).toBe('foo');

        cache.put('bar');

        expect(cache.get()).toBe('bar');
    });

    test('should provide a mechanism to sync the cache with external changes', async () => {
        const cache = new LocalStorageCache(localStorage, 'key');

        const disable = LocalStorageCache.autoSync(cache);

        const listener = jest.fn();
        cache.addListener(listener);

        cache.put('bar');

        localStorage.setItem('key', 'foo');

        window.dispatchEvent(
            new StorageEvent('storage', {
                bubbles: false,
                cancelable: false,
                key: 'key',
                oldValue: 'bar',
                // Should ignore this value and retrieve from the store
                newValue: 'foo1',
                storageArea: localStorage,
            }),
        );

        // Should ignore unrelated changes
        window.dispatchEvent(
            new StorageEvent('storage', {
                bubbles: false,
                cancelable: false,
                key: 'unrelatedKey',
                oldValue: 'foo',
                newValue: 'baz',
                storageArea: localStorage,
            }),
        );

        disable();

        localStorage.setItem('key', 'qux');

        window.dispatchEvent(
            new StorageEvent('storage', {
                bubbles: false,
                cancelable: false,
                key: 'croct.token',
                oldValue: 'foo',
                newValue: 'qux',
                storageArea: localStorage,
            }),
        );

        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenNthCalledWith(1, 'bar');
        expect(listener).toHaveBeenNthCalledWith(2, 'foo');

        expect(cache.get()).toBe('foo');
    });
});
