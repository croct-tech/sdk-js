import type {UserRouteConfig} from 'fetch-mock';
import fetchMock from 'fetch-mock';
import {RemoteAssigner} from '../../src/cid';

jest.mock(
    '../../src/constants',
    () => ({
        ...jest.requireActual('../../src/constants'),
        'X-Client-Library': 'Plug v1.0.0',
    }),
);

describe('A remote CID assigner', () => {
    const ENDPOINT = 'https://localhost:8080/endpoint';

    const requestMatcher: UserRouteConfig = {
        method: 'GET',
        headers: {
        },
        url: ENDPOINT,
        response: '123',
    };

    beforeEach(() => {
        fetchMock.removeRoutes();
        fetchMock.clearHistory();
    });

    afterEach(() => {
        fetchMock.unmockGlobal();
    });

    it('should call a HTTP endpoint to assign a CID', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        fetchMock.mockGlobal().route(requestMatcher);

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');

        expect(new Headers(fetchMock.callHistory.calls()[0].options.headers).has('X-Client-Library')).toBe(false);
    });

    it('should use the configured client library', async () => {
        const assigner = new RemoteAssigner(ENDPOINT, undefined, 'Croct JavaScript SDK v1.0.0');

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {'X-Client-Library': 'Croct JavaScript SDK v1.0.0'},
        });

        await expect(assigner.assignCid()).resolves.toEqual('123');
    });

    it('should fail if a HTTP error occurs', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: 503,
        });

        await expect(cachedAssigner.assignCid()).rejects.toThrow('Failed to assign CID: service Unavailable');
    });

    it('should not assign CIDs concurrently', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        let resolve: {(value: string): void} = jest.fn();

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: new Promise(resolver => {
                resolve = resolver;
            }),
        });

        const done = jest.fn();

        const firstCid = cachedAssigner.assignCid();
        const secondCid = cachedAssigner.assignCid();

        firstCid.then(done);
        secondCid.then(done);

        expect(done).not.toHaveBeenCalled();

        resolve('123');

        await expect(firstCid).resolves.toEqual('123');
        await expect(secondCid).resolves.toEqual('123');

        expect(done).toHaveBeenCalled();
    });

    it('should pass the current CID to the endpoint', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            url: `${ENDPOINT}?cid=321`,
        });

        await expect(cachedAssigner.assignCid('321')).resolves.toEqual('123');
    });
});
