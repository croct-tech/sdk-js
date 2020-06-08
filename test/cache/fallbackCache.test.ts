import Cache from '../../src/cache';
import FallbackCache from '../../src/cache/fallbackCache';

describe('An fallback cache', () => {
    test('should retrieve data from one of the underlying caches', async () => {
        const firstCache: Cache = {
            get: jest.fn()
                .mockReturnValueOnce(null)
                .mockReturnValueOnce('foo'),
            put: jest.fn(),
            clear: jest.fn(),
        };

        const secondCache: Cache = {
            get: jest.fn().mockReturnValue(null),
            put: jest.fn(),
            clear: jest.fn(),
        };

        const cache = new FallbackCache(firstCache, secondCache);

        expect(cache.get()).toBeNull();

        expect(firstCache.get).toBeCalledTimes(1);
        expect(secondCache.get).toBeCalledTimes(1);

        expect(cache.get()).toBe('foo');

        expect(firstCache.get).toBeCalledTimes(2);
        expect(secondCache.get).toBeCalledTimes(1);
    });

    test('should store data into all underlying caches', async () => {
        const firstCache: Cache = {
            get: jest.fn(),
            put: jest.fn(),
            clear: jest.fn(),
        };

        const secondCache: Cache = {
            get: jest.fn(),
            put: jest.fn(),
            clear: jest.fn(),
        };

        const cache = new FallbackCache(firstCache, secondCache);

        cache.put('bar');

        expect(firstCache.put).toBeCalledTimes(1);
        expect(firstCache.put).toBeCalledWith('bar');
        expect(secondCache.put).toBeCalledTimes(1);
        expect(secondCache.put).toBeCalledWith('bar');
    });

    test('should clear all underlying caches', async () => {
        const firstCache: Cache = {
            get: jest.fn(),
            put: jest.fn(),
            clear: jest.fn(),
        };

        const secondCache: Cache = {
            get: jest.fn(),
            put: jest.fn(),
            clear: jest.fn(),
        };

        const cache = new FallbackCache(firstCache, secondCache);

        cache.clear();

        expect(firstCache.clear).toBeCalledTimes(1);
        expect(secondCache.clear).toBeCalledTimes(1);
    });
});
