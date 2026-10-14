/**
 * @jest-environment node
 */
import fetchMock from 'fetch-mock';
import {EventPublisher} from '../src/eventPublisher';

describe('An event publisher running on the server', () => {
    afterEach(() => {
        fetchMock.removeRoutes();
        fetchMock.clearHistory();
        fetchMock.unmockGlobal();
    });

    it('should not set the request mode', async () => {
        const publisher = new EventPublisher({
            appId: '06e3d5fb-cdfd-4270-8eba-de7a7bb04b5f',
            baseEndpointUrl: 'https://track.example.com',
        });

        fetchMock.mockGlobal().route('https://track.example.com/client/web/track', 200);

        await publisher.publish({
            type: 'goalCompleted',
            payload: {goalId: 'signup'},
            clientId: 'c3b5b9f0-5f9a-4b3c-8c9c-8b5c8b5c8b5c',
            timestamp: Date.now(),
            context: {
                tabId: '4b3c9b0e-8c3f-4d8f-9e5a-2b1c7d6e5f4a',
                url: 'https://example.com',
            },
        });

        expect(fetchMock.callHistory.lastCall()!.options.mode).toBeUndefined();
    });
});
