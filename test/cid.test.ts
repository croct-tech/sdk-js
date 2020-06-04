import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import {CachedAssigner, CidAssigner, FixedCidAssigner, RemoteAssigner} from '../src/cid';
import NullLogger from '../src/logging/nullLogger';

describe('A remote CID assigner', () => {
    const ENDPOINT = 'https://localhost:8080/endpoint';

    const requestMatcher: MockOptions = {
        method: 'GET',
        matcher: ENDPOINT,
        response: '123',
    };

    afterEach(() => {
        fetchMock.reset();
    });

    test('should call a HTTP endpoint to assign a CID', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        fetchMock.mock(requestMatcher);

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');
    });

    test('should fail if a HTTP error occurs', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        fetchMock.mock({
            ...requestMatcher,
            response: 503,
        });

        await expect(cachedAssigner.assignCid()).rejects.toThrow('Failed to assign CID: service Unavailable');
    });
});

describe('A cached CID assigner', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('should try to retrieve the CID from cache', async () => {
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn()};
        const cachedAssigner = new CachedAssigner(underlyingAssigner, localStorage, 'cid');

        localStorage.setItem('cid', '123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).not.toHaveBeenCalled();
    });

    test('should assign and cache new CIDs', async () => {
        const underlyingAssigner: CidAssigner = {assignCid: jest.fn().mockResolvedValue('123')};
        const cachedAssigner = new CachedAssigner(underlyingAssigner, localStorage, 'cid', new NullLogger());

        expect(localStorage.getItem('cid')).toBeNull();

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(localStorage.getItem('cid')).toBe('123');

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(underlyingAssigner.assignCid).toHaveBeenCalledTimes(1);
    });
});

describe('A fixed CID assigner', () => {
    test('should always provide the same CID', async () => {
        const assigner = new FixedCidAssigner('123');

        await expect(assigner.assignCid()).resolves.toEqual('123');
        await expect(assigner.assignCid()).resolves.toEqual('123');
        await expect(assigner.assignCid()).resolves.toEqual('123');
    });
});
