import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import {RemoteAssigner} from '../../src/cid';
import {CLIENT_LIBRARY} from '../../src/constants';

jest.mock(
    '../../src/constants',
    () => ({
        ...jest.requireActual('../../src/constants'),
        'X-Client-Library': 'Plug v1.0.0',
    }),
);

describe('A remote CID assigner', () => {
    const ENDPOINT = 'https://localhost:8080/endpoint';

    const requestMatcher: MockOptions = {
        method: 'GET',
        headers: {
            'X-Client-Library': CLIENT_LIBRARY,
        },
        matcher: ENDPOINT,
        response: '123',
    };

    afterEach(() => {
        fetchMock.reset();
    });

    it('should call a HTTP endpoint to assign a CID', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        fetchMock.mock(requestMatcher);

        await expect(cachedAssigner.assignCid()).resolves.toEqual('123');
    });

    it('should fail if a HTTP error occurs', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        fetchMock.mock({
            ...requestMatcher,
            response: 503,
        });

        await expect(cachedAssigner.assignCid()).rejects.toThrow('Failed to assign CID: service Unavailable');
    });

    it('should not assign CIDs concurrently', async () => {
        const cachedAssigner = new RemoteAssigner(ENDPOINT);

        let resolve: {(value: string): void} = jest.fn();

        fetchMock.mock({
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
});
