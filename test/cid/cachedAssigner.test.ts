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

        expect(logger.debug).toHaveBeenCalledWith('Using existing CID');
    });

    it('should try to use the current CID when available', async () => {
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

        await expect(cachedAssigner.assignCid('123')).resolves.toEqual('123');

        // Ensure the cache is used at the second call
        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).not.toHaveBeenCalled();
    });

    it('should use the current CID over the cached CID', async () => {
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

        await expect(cachedAssigner.assignCid('321')).resolves.toEqual('321');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('321');

        expect(logger.debug).toHaveBeenCalledWith('The cached CID is stale, updating cache...');

        expect(underlyingAssigner.assignCid).not.toHaveBeenCalled();
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

        expect(logger.debug).toHaveBeenCalledWith('Using existing CID');

        expect(logger.debug).toHaveBeenCalledWith('Refreshing CID');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('321');

        expect(underlyingAssigner.assignCid).toHaveBeenCalledTimes(2);

        expect(logger.warn).toHaveBeenCalledWith('The CID has changed, updating cache...');
    });

    it('should pass the current CID to the underlying assigner', async () => {
        const underlyingAssigner: CidAssigner = {
            assignCid: jest.fn((cid: string) => Promise.resolve(cid)),
        };

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

        // Make sure it will use the current CID and not the cached one
        cache.put('456');

        await expect(cachedAssigner.assignCid('123')).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).toHaveBeenCalledTimes(1);
        expect(underlyingAssigner.assignCid).toHaveBeenCalledWith('123');
    });

    it('should pass the cached CID to the underlying assigner', async () => {
        const underlyingAssigner: CidAssigner = {
            assignCid: jest.fn((cid: string) => Promise.resolve(cid)),
        };

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
        expect(underlyingAssigner.assignCid).toHaveBeenCalledWith('123');
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
