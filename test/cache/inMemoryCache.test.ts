import InMemoryCache from '../../src/cache/inMemoryCache';

describe('An in-memory cache', () => {
    test('should cache data in memory', async () => {
        const cache = new InMemoryCache();

        expect(cache.get()).toBeNull();

        cache.put('foo');

        expect(cache.get()).toBe('foo');

        cache.clear();

        expect(cache.get()).toBeNull();
    });
});
