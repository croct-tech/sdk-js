import StorageCache from '../../src/cache/storageCache';

describe('A storage cache', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('should cache data into the provided storage', async () => {
        const cache = new StorageCache(localStorage, 'key');

        expect(localStorage.getItem('key')).toBeNull();
        expect(cache.get()).toBeNull();

        cache.put('foo');

        expect(localStorage.getItem('key')).toBe('foo');
        expect(cache.get()).toBe('foo');

        cache.put(null);

        expect(localStorage.getItem('key')).toBeNull();
        expect(cache.get()).toBeNull();
    });
});
