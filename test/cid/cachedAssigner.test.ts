import {CidAssigner, CachedAssigner} from '../../src/cid';
import {NullLogger} from '../../src/logging';
import {Cache, InMemoryCache} from '../../src/cache';

describe('A cached CID assigner', () => {
    afterEach(() => {
        localStorage.clear();
    });

    it('should try to retrieve the CID from cache', async () => {
        const cache: Cache = new InMemoryCache();
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn()};
        const cachedAssigner = new CachedAssigner(underlyingAssigner, cache);

        cache.put('123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).not.toHaveBeenCalled();
    });

    it('should assign and cache new CIDs', async () => {
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
