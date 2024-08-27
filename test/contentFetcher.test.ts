import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import {EvaluationContext} from '../src/evaluator';
import {Token} from '../src/token';
import {ContentFetcher, ContentError, ContentErrorType, ErrorResponse, FetchOptions} from '../src/contentFetcher';
import {BASE_ENDPOINT_URL, CLIENT_LIBRARY} from '../src/constants';
import {ApiKey} from '../src/apiKey';
import {Logger} from '../src/logging';
import {Help} from '../src/help';

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
    const parsedApiKey = ApiKey.of(
        '00000000-0000-0000-0000-000000000000',
        'ES256;MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg3TbbvRM7DNwxY3XGWDmlSRPSfZ9b+ch9TO3jQ6'
        + '8Zyj+hRANCAASmJj/EiEhUaLAWnbXMTb/85WADkuFgoELGZ5ByV7YPlbb2wY6oLjzGkpF6z8iDrvJ4kV6EhaJ4n0HwSQckVLNE',
    );
    const plainTextApiKey = parsedApiKey.getIdentifier();

    const contentId = 'hero-banner';
    const content = {
        content: {
            title: 'Hello World',
        },
    };

    const requestMatcher: MockOptions = {
        functionMatcher: (_, req) => req.mode === 'cors',
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
        jest.useRealTimers();
    });

    it('should require either an application ID or API key', async () => {
        await expect(() => new ContentFetcher({}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should require either an application ID or API key, but not both', async () => {
        await expect(() => new ContentFetcher({apiKey: plainTextApiKey, appId: appId}))
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

    it.each<[string, string|ApiKey]>([
        ['an API key', parsedApiKey],
        ['an plain-text API key', plainTextApiKey],
    ])('should use the external endpoint for static content passing %s', async (_, apiKey) => {
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
                'X-Api-Key': parsedApiKey.getIdentifier(),
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should require an API key to fetch static content', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        await expect(() => fetcher.fetch(contentId, {static: true}))
            .toThrowWithMessage(Error, 'The API key must be provided to fetch static content.');
    });

    it('should use the external endpoint when specifying an API key', async () => {
        const fetcher = new ContentFetcher({
            apiKey: plainTextApiKey,
        });

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': parsedApiKey.getIdentifier(),
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId)).resolves.toEqual(content);
    });

    it('should fetch static content for the specified slot version', async () => {
        const fetcher = new ContentFetcher({
            apiKey: plainTextApiKey,
        });

        const options: FetchOptions = {
            static: true,
            version: 2,
        };

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/static-content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': parsedApiKey.getIdentifier(),
            },
            body: {
                ...requestMatcher.body,
                version: `${options.version}`,
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should fetch static content for the specified preferred locale', async () => {
        const fetcher = new ContentFetcher({
            apiKey: plainTextApiKey,
        });

        const options: FetchOptions = {
            static: true,
            preferredLocale: 'en-US',
        };

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/static-content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': parsedApiKey.getIdentifier(),
            },
            body: {
                ...requestMatcher.body,
                preferredLocale: options.preferredLocale,
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should fetch dynamic content using the provided client ID', async () => {
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

    it('should fetch dynamic content passing the provided client IP', async () => {
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

    it('should fetch dynamic content passing the provided client agent', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

        const options: FetchOptions = {
            clientAgent: userAgent,
        };

        fetchMock.mock({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Agent': userAgent,
            },
            response: content,
        });

        await expect(fetcher.fetch(contentId, options)).resolves.toEqual(content);
    });

    it('should fetch dynamic content using the provided user token', async () => {
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

    it('should fetch dynamic content using the provided preview token', async () => {
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
        jest.useFakeTimers();

        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const fetcher = new ContentFetcher({
            appId: appId,
            logger: logger,
            // Ensure the specified timeout has precedence over the default timeout
            defaultTimeout: 15,
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

        jest.advanceTimersByTime(11);

        const fetchOptions = fetchMock.lastOptions() as MockOptions & {signal: AbortSignal} | undefined;

        expect(fetchOptions?.signal).toBeDefined();

        await expect(promise).rejects.toThrow(ContentError);

        await expect(promise).rejects.toHaveProperty('response', {
            title: 'Maximum timeout reached before content could be loaded.',
            type: ContentErrorType.TIMEOUT,
            detail: 'The content took more than 10ms to load.',
            status: 408,
        });

        expect(fetchOptions?.signal.aborted).toBe(true);

        expect(logger.error).toHaveBeenCalledWith(Help.forStatusCode(408));
    });

    it('should use the default timeout if none is specified', async () => {
        jest.useFakeTimers();

        const fetcher = new ContentFetcher({
            appId: appId,
            defaultTimeout: 10,
        });

        fetchMock.mock({
            ...requestMatcher,
            delay: 20,
            response: {
                result: 'Carol',
            },
        });

        const promise = fetcher.fetch(contentId);

        jest.advanceTimersByTime(11);

        await expect(promise).rejects.toThrow(ContentError);

        await expect(promise).rejects.toHaveProperty('response', {
            title: 'Maximum timeout reached before content could be loaded.',
            type: ContentErrorType.TIMEOUT,
            detail: 'The content took more than 10ms to load.',
            status: 408,
        });
    });

    it('should fetch dynamic content using the provided context', async () => {
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

    it('should fetch dynamic content for the specified slot version', async () => {
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

    it('should fetch dynamic content for the specified preferred locale', async () => {
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
        await expect(promise).rejects.toHaveProperty('response', response);
    });

    it('should catch deserialization errors', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const response: ErrorResponse = {
            title: 'Error 500 - Internal Server Error',
            type: ContentErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        fetchMock.mock({
            ...requestMatcher,
            response: {
                status: 500,
                body: 'Invalid JSON payload',
            },
        });

        const promise = fetcher.fetch(contentId);

        await expect(promise).rejects.toThrow(ContentError);
        await expect(promise).rejects.toHaveProperty('response', response);
    });

    it('should catch unexpected error responses', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const response: ErrorResponse = {
            title: `Invalid json response body at ${BASE_ENDPOINT_URL}/client/web/content reason: `
            + 'Unexpected token \'I\', "Invalid JSON payload" is not valid JSON',
            type: ContentErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        fetchMock.mock({
            ...requestMatcher,
            response: {
                body: 'Invalid JSON payload',
            },
        });

        const promise = fetcher.fetch(contentId);

        await expect(promise).rejects.toThrow(ContentError);
        await expect(promise.catch((error: ContentError) => error.response)).resolves.toEqual(response);
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
        await expect(promise).rejects.toHaveProperty('response', response);
    });

    type HelpScenario = {
        status: number,
        title: string,
    };

    it.each<HelpScenario>([
        {
            status: 401,
            title: 'Unauthorized request',
        },
        {
            status: 403,
            title: 'Unallowed origin',
        },
        {
            status: 423,
            title: 'Quota exceeded',
        },
    ])('should log help messages for status code $status', async scenario => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const fetcher = new ContentFetcher({
            appId: appId,
            logger: logger,
        });

        fetchMock.mock({
            ...requestMatcher,
            response: {
                status: scenario.status,
                body: {
                    type: 'https://croct.help/api/content',
                    status: scenario.status,
                    title: scenario.title,
                } satisfies ErrorResponse,
            },
        });

        const promise = fetcher.fetch(contentId);

        await expect(promise).rejects.toThrowWithMessage(ContentError, scenario.title);

        const log = Help.forStatusCode(scenario.status);

        expect(log).toBeDefined();
        expect(logger.error).toHaveBeenCalledWith(log);
    });

    it('should log the region and processing time', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const fetcher = new ContentFetcher({
            appId: appId,
            logger: logger,
        });

        fetchMock.mock({
            ...requestMatcher,
            response: {
                status: 200,
                body: content,
                headers: {
                    'X-Croct-Region': 'us-central1',
                    'X-Croct-Timing': '120.1234ms',
                },
            },
        });

        await fetcher.fetch(contentId);

        expect(logger.debug).toHaveBeenCalledWith('Request processed by region us-central1 in 120.1234ms');
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
