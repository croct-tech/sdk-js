import {Cache, FallbackCache} from '../../src/cache';

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

        expect(firstCache.get).toHaveBeenCalledTimes(1);
        expect(secondCache.get).toHaveBeenCalledTimes(1);

        expect(cache.get()).toBe('foo');

        expect(firstCache.get).toHaveBeenCalledTimes(2);
        expect(secondCache.get).toHaveBeenCalledTimes(1);
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

        expect(firstCache.put).toHaveBeenCalledTimes(1);
        expect(firstCache.put).toHaveBeenCalledWith('bar');
        expect(secondCache.put).toHaveBeenCalledTimes(1);
        expect(secondCache.put).toHaveBeenCalledWith('bar');
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

        expect(firstCache.clear).toHaveBeenCalledTimes(1);
        expect(secondCache.clear).toHaveBeenCalledTimes(1);
    });
});
