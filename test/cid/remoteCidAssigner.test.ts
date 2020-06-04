import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import RemoteAssigner from '../../src/cid/remoteAssigner';

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

