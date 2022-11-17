import {InMemoryCache} from '../../src/cache';

describe('An in-memory cache', () => {
    it('should cache data in memory', () => {
        const cache = new InMemoryCache();

        expect(cache.get()).toBeNull();

        cache.put('foo');

        expect(cache.get()).toBe('foo');

        cache.clear();

        expect(cache.get()).toBeNull();
    });
});
