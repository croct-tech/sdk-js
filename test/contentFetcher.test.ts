import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import {EvaluationContext} from '../src/evaluator';
import {Token, FixedTokenProvider} from '../src/token';
import {CidAssigner, FixedAssigner} from '../src/cid';
import {ContentFetcher, ContentError, ContentErrorType, ErrorResponse} from '../src/contentFetcher';
import {CONTENT_ENDPOINT_URL} from '../src/constants';

jest.mock('../src/constants', () => ({
    ...jest.requireActual('../src/constants'),
    CONTENT_ENDPOINT_URL: 'https://croct.io/content',
}));

describe('A content fetcher', () => {
    const appId = '06e3d5fb-cdfd-4270-8eba-de7a7bb04b5f';
    const clientId = 'c3b5b9f0-5f9a-4b3c-8c9c-8b5c8b5c8b5c';
    const contentId = 'hero-banner';
    const content = {
        content: {
            title: 'Hello World',
        },
    };

    const requestMatcher: MockOptions = {
        matcher: CONTENT_ENDPOINT_URL,
        method: 'POST',
        headers: {
            'X-App-Id': appId,
            'X-Client-Id': clientId,
        },
        body: {
            slotId: contentId,
        },
    };

    afterEach(() => {
        fetchMock.reset();
        jest.clearAllMocks();
    });

    test('should use the specified endpoint', async () => {
        const customEndpoint = 'https://custom.endpoint.com/content';

        const fetcher = new ContentFetcher({
            appId: appId,
            endpointUrl: customEndpoint,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        fetchMock.mock({
            ...requestMatcher,
            matcher: customEndpoint,
            response: content,
        });

        await expect(fetcher.fetch(contentId)).resolves.toEqual(content);
    });

    test('should fetch content without token when not provided', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        fetchMock.mock({
            ...requestMatcher,
            response: content,
        });

        await expect(fetcher.fetch(contentId)).resolves.toEqual(content);
    });

    test('should fetch content with user token when provided', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(token),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        fetchMock.mock({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Token': token.toString(),
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId)).resolves.toEqual(content);
    });

    test('should fetch content with preview token when provided', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(token),
        });

        fetchMock.mock({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                previewToken: token.toString(),
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId)).resolves.toEqual(content);
    });

    test('should abort after reaching the timeout', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        fetchMock.mock({
            ...requestMatcher,
            delay: 20,
            response: {
                result: 'Carol',
            },
        });

        const promise = fetcher.fetch(contentId, {
            timeout: 10,
        });

        // Flush promises
        await Promise.resolve();

        const fetchOptions = fetchMock.lastOptions() as MockOptions & {signal: AbortSignal} | undefined;

        expect(fetchOptions?.signal).toBeDefined();

        await expect(promise).rejects.toThrow(ContentError);

        await expect(promise).rejects.toEqual(expect.objectContaining({
            response: {
                title: 'Maximum timeout reached before content could be loaded.',
                type: ContentErrorType.TIMEOUT,
                detail: 'The content took more than 10ms to load.',
                status: 408,
            },
        }));

        expect(fetchOptions?.signal.aborted).toBe(true);
    });

    test('should fetch content using the provided context', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        const context: Required<EvaluationContext> = {
            timeZone: 'America/Sao_Paulo',
            page: {
                referrer: 'http://referrer.com',
                url: 'http://site.com.br',
                title: 'Page Title',
            },
            campaign: {
                name: 'Black-friday',
                source: 'Google',
                medium: 'CPC',
                content: 'banner',
                term: 'discount',
            },
            attributes: {
                hotDeal: false,
            },
        };

        fetchMock.mock({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                context: context,
            },
            response: content,
        });

        const promise = fetcher.fetch(contentId, {context: context});

        await expect(promise).resolves.toEqual(content);
    });

    test('should fetch content for the specified slot version', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        const version = 2;

        fetchMock.mock({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                version: `${version}`,
            },
            response: content,
        });

        const promise = fetcher.fetch(contentId, {version: version});

        await expect(promise).resolves.toEqual(content);
    });

    test('should fetch content for the specified preferred locale', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        const preferredLocale = 'pt_BR';

        fetchMock.mock({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                preferredLocale: preferredLocale,
            },
            response: content,
        });

        const promise = fetcher.fetch(contentId, {preferredLocale: preferredLocale});

        await expect(promise).resolves.toEqual(content);
    });

    test('should report errors if the fetch fails', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        const response: ErrorResponse = {
            type: 'error',
            title: 'Error title',
            status: 400,
        };

        fetchMock.mock({
            ...requestMatcher,
            response: {
                status: 400,
                body: response,
            },
        });

        const promise = fetcher.fetch(contentId);

        await expect(promise).rejects.toThrow(ContentError);
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    test('should report unexpected errors when the cause of the fetch failure is unknown', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        const response: ErrorResponse = {
            title: 'Something went wrong',
            type: ContentErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        fetchMock.mock({
            ...requestMatcher,
            response: {
                throws: new Error(response.title),
            },
        });

        const promise = fetcher.fetch(contentId);

        await expect(promise).rejects.toThrow(ContentError);
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    test('should report an unexpected error occurring while assigning a CID', async () => {
        const cidAssigner: CidAssigner = {
            assignCid: jest.fn().mockRejectedValue(new Error('Unexpected CID error.')),
        };

        const fetcher = new ContentFetcher({
            appId: appId,
            cidAssigner: cidAssigner,
            userTokenProvider: new FixedTokenProvider(null),
            previewTokenProvider: new FixedTokenProvider(null),
        });

        const response: ErrorResponse = {
            title: 'Unexpected CID error.',
            type: ContentErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        const promise = fetcher.fetch(contentId);

        await expect(promise).rejects.toThrow(ContentError);
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });
});

describe('A content error', () => {
    test('should have a response', () => {
        const response: ErrorResponse = {
            type: ContentErrorType.UNEXPECTED_ERROR,
            title: 'Error title',
            status: 400,
        };

        const error = new ContentError(response);

        expect(error.response).toEqual(response);
    });
});
