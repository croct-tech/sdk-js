import CidAssigner from '../../src/cid';
import NullLogger from '../../src/logging/nullLogger';
import InMemoryCache from '../../src/cache/inMemoryCache';
import Cache from '../../src/cache';
import CachedAssigner from '../../src/cid/cachedAssigner';

describe('A cached CID assigner', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('should try to retrieve the CID from cache', async () => {
        const cache: Cache = new InMemoryCache();
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn()};
        const cachedAssigner = new CachedAssigner(underlyingAssigner, cache);

        cache.put('123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).not.toHaveBeenCalled();
    });

    test('should assign and cache new CIDs', async () => {
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn().mockResolvedValue('123')};
        const cache: Cache = new InMemoryCache();
        const cachedAssigner = new CachedAssigner(underlyingAssigner, cache, new NullLogger());

        expect(cache.get()).toBeNull();

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(cache.get()).toBe('123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).toHaveBeenCalledTimes(1);
    });
});
