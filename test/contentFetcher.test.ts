import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import {EvaluationContext} from '../src/evaluator';
import {Token} from '../src/token';
import {ContentFetcher, ContentError, ContentErrorType, ErrorResponse, FetchOptions} from '../src/contentFetcher';
import {BASE_ENDPOINT_URL, CLIENT_LIBRARY} from '../src/constants';

jest.mock(
    '../src/constants',
    () => ({
        ...jest.requireActual('../src/constants'),
        BASE_ENDPOINT_URL: 'https://croct.io',
        'X-Client-Library': 'Plug v1.0.0',
    }),
);

describe('A content fetcher', () => {
    const appId = '06e3d5fb-cdfd-4270-8eba-de7a7bb04b5f';
    const apiKey = '00000000-0000-0000-0000-000000000000';

    const contentId = 'hero-banner';
    const content = {
        content: {
            title: 'Hello World',
        },
    };

    const requestMatcher: MockOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-Library': CLIENT_LIBRARY,
        },
        body: {
            slotId: contentId,
        },
    };

    afterEach(() => {
        fetchMock.reset();
        jest.clearAllMocks();
    });

    it('should require either an application ID or API key', async () => {
        await expect(() => new ContentFetcher({}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should require either an application ID or API key, but not both', async () => {
        await expect(() => new ContentFetcher({apiKey: apiKey, appId: appId}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should use the specified base endpoint', async () => {
        const customEndpoint = 'https://custom.endpoint.com';

        const fetcher = new ContentFetcher({
            appId: appId,
            baseEndpointUrl: customEndpoint,
        });

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${customEndpoint}/client/web/content`,
            response: content,
        });

        await expect(fetcher.fetch(contentId)).resolves.toEqual(content);
    });

    it('should use the external endpoint for static content', async () => {
        const fetcher = new ContentFetcher({
            apiKey: apiKey,
        });

        const options: FetchOptions = {
            static: true,
        };

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/static-content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': apiKey,
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should requite an API key to fetch static content', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        await expect(() => fetcher.fetch(contentId, {static: true}))
            .toThrowWithMessage(Error, 'The API key must be provided to fetch static content.');
    });

    it('should use the external endpoint when specifying an API key', async () => {
        const fetcher = new ContentFetcher({
            apiKey: apiKey,
        });

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': apiKey,
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId)).resolves.toEqual(content);
    });

    it('should fetch content using the provided client ID', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const clientId = 'c3b5b9f0-5f9a-4b3c-8c9c-8b5c8b5c8b5c';

        const options: FetchOptions = {
            clientId: clientId,
        };

        fetchMock.mock({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Id': clientId,
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should fetch content passing the provided client IP', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const clientIp = '192.168.0.1';

        const options: FetchOptions = {
            clientIp: clientIp,
        };

        fetchMock.mock({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Ip': clientIp,
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should fetch content passing the provided user agent', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

        const options: FetchOptions = {
            userAgent: userAgent,
        };

        fetchMock.mock({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'User-Agent': userAgent,
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should fetch content using the provided user token', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const fetcher = new ContentFetcher({
            appId: appId,
        });

        fetchMock.mock({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Token': token.toString(),
            },
            response: content,
        });

        const options: FetchOptions = {
            userToken: token,
        };

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should fetch content using the provided preview token', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const fetcher = new ContentFetcher({
            appId: appId,
        });

        fetchMock.mock({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                previewToken: token.toString(),
            },
            response: content,
        });

        const options: FetchOptions = {
            previewToken: token,
        };

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should fetch using the extra options', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        fetchMock.mock({
            ...requestMatcher,
            response: {
                result: 'Carol',
            },
        });

        const overridableOptions: RequestInit = {
            credentials: 'omit',
        };

        const nonOverridableOptions: RequestInit = {
            method: 'GET',
            headers: {
                invalid: 'header',
            },
            signal: undefined,
            body: 'invalid body',
        };

        const extraOptions: RequestInit = {
            ...overridableOptions,
            ...nonOverridableOptions,
        };

        await fetcher.fetch(contentId, {extra: extraOptions as FetchOptions['extra']});

        expect(fetchMock.lastOptions()).toEqual(expect.objectContaining(overridableOptions));
        expect(fetchMock.lastOptions()).not.toEqual(expect.objectContaining(nonOverridableOptions));
    });

    it('should abort after reaching the timeout', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
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

    it('should fetch content using the provided context', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
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

    it('should fetch content for the specified slot version', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
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

    it('should fetch content for the specified preferred locale', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
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

    it('should report errors if the fetch fails', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
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

    it('should catch deserialization errors', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const response: ErrorResponse = {
            title: expect.stringMatching('Invalid json response body'),
            type: ContentErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        fetchMock.mock({
            ...requestMatcher,
            response: {
                body: 'non-json',
            },
        });

        const promise = fetcher.fetch(contentId);

        await expect(promise).rejects.toThrow(ContentError);
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    it('should report unexpected errors when the cause of the fetch failure is unknown', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
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

    it('should not be serializable', () => {
        expect(() => new ContentFetcher({appId: appId}).toJSON())
            .toThrowWithMessage(Error, 'Unserializable value.');
    });
});

describe('A content error', () => {
    it('should have a response', () => {
        const response: ErrorResponse = {
            type: ContentErrorType.UNEXPECTED_ERROR,
            title: 'Error title',
            status: 400,
        };

        const error = new ContentError(response);

        expect(error.response).toEqual(response);
    });
});
