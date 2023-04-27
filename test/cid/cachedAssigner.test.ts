import {CidAssigner, CachedAssigner} from '../../src/cid';
import {Cache, InMemoryCache} from '../../src/cache';
import {Logger} from '../../src/logging';

describe('A cached CID assigner', () => {
    afterEach(() => {
        localStorage.clear();
    });

    it('should try to retrieve the CID from cache', async () => {
        const cache: Cache = new InMemoryCache();
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn()};
        const logger: Logger = {
            debug: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
        };

        const cachedAssigner = new CachedAssigner(underlyingAssigner, cache, {
            logger: logger,
        });

        cache.put('123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).not.toHaveBeenCalled();

        expect(logger.debug).toHaveBeenCalledWith('Previous CID loaded from cache');
    });

    it('should assign and cache new CIDs', async () => {
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn().mockResolvedValue('123')};
        const cache: Cache = new InMemoryCache();
        const logger: Logger = {
            debug: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
        };

        const cachedAssigner = new CachedAssigner(underlyingAssigner, cache, {
            logger: logger,
        });

        expect(cache.get()).toBeNull();

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(cache.get()).toBe('123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).toHaveBeenCalledTimes(1);

        expect(logger.debug).toHaveBeenCalledWith('New CID stored into cache');
    });

    it('should refresh the CID if requested', async () => {
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn().mockResolvedValue('321')};
        const cache: Cache = new InMemoryCache();
        const logger: Logger = {
            debug: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
        };

        const cachedAssigner = new CachedAssigner(underlyingAssigner, cache, {
            logger: logger,
            refresh: true,
        });

        cache.put('123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).toHaveBeenCalledTimes(1);

        expect(logger.debug).toHaveBeenCalledWith('Previous CID loaded from cache');

        expect(logger.debug).toHaveBeenCalledWith('Refreshing CID');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('321');

        expect(underlyingAssigner.assignCid).toHaveBeenCalledTimes(2);

        expect(logger.warn).toHaveBeenCalledWith('The CID has changed, updating cache');
    });

    it('should handle errors when refreshing the CID', async () => {
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn().mockRejectedValue(new Error('Failed'))};
        const cache: Cache = new InMemoryCache();
        const logger: Logger = {
            debug: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
        };

        const cachedAssigner = new CachedAssigner(underlyingAssigner, cache, {
            logger: logger,
            refresh: true,
        });

        cache.put('123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).toHaveBeenCalledTimes(1);

        expect(logger.error).toHaveBeenCalledWith('Failed to refresh CID');
    });
});
