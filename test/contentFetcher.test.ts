import fetchMock, {CallLog, UserRouteConfig} from 'fetch-mock';
import {EvaluationContext} from '../src/evaluator';
import {Token} from '../src/token';
import {
    ContentFetcher,
    ContentError,
    ContentErrorType,
    ErrorResponse,
    FetchOptions,
    FetchResponse,
} from '../src/contentFetcher';
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
    const apiKey = ApiKey.parse(
        '00000000-0000-0000-0000-000000000000:ES256;'
        + 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg3TbbvRM7DNwxY3XGWDmlSRPSfZ9b+ch9TO3jQ68Zyj+'
        + 'hRANCAASmJj/EiEhUaLAWnbXMTb/85WADkuFgoELGZ5ByV7YPlbb2wY6oLjzGkpF6z8iDrvJ4kV6EhaJ4n0HwSQckVLNE',
    );
    const apiKeyIdentifier = apiKey.getIdentifier();
    const plainTextApiKey = `${apiKey.getIdentifier()}:${apiKey.getPrivateKey()}`;

    const slotId = 'hero-banner';
    const result: FetchResponse = {
        metadata: {
            version: '1.0',
        },
        content: {
            title: 'Hello World',
        },
    };

    const requestMatcher: UserRouteConfig = {
        matcherFunction: (callLog: CallLog) => callLog !== undefined && callLog.options.mode === 'cors',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-Library': CLIENT_LIBRARY,
        },
        body: {
            slotId: slotId,
        },
    };

    afterEach(() => {
        fetchMock.removeRoutes();
        fetchMock.clearHistory();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    afterEach(() => {
        fetchMock.unmockGlobal();
    });

    it('should require either an application ID or API key', () => {
        expect(() => new ContentFetcher({}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should require either an application ID or API key, but not both', () => {
        expect(() => new ContentFetcher({apiKey: apiKeyIdentifier, appId: appId}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should use the specified base endpoint', async () => {
        const customEndpoint = 'https://custom.endpoint.com';

        const fetcher = new ContentFetcher({
            appId: appId,
            baseEndpointUrl: customEndpoint,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            matcher: `${customEndpoint}/client/web/content`,
            response: result,
        });

        await expect(fetcher.fetch(slotId)).resolves.toEqual(result);
    });

    it.each<[string, string|ApiKey]>([
        ['an API key', apiKey],
        ['an plain-text API key identifier', apiKeyIdentifier],
        ['an plain-text API key', plainTextApiKey],
    ])('should use the external endpoint for static content passing %s', async (_, value) => {
        const fetcher = new ContentFetcher({
            apiKey: value,
        });

        const options: FetchOptions = {
            static: true,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/static-content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': apiKey.getIdentifier(),
            },
            response: result,
        });

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should require an API key to fetch static content', () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        expect(() => fetcher.fetch(slotId, {static: true}))
            .toThrowWithMessage(Error, 'The API key must be provided to fetch static content.');
    });

    it('should use the external endpoint when specifying an API key', async () => {
        const fetcher = new ContentFetcher({
            apiKey: apiKeyIdentifier,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': apiKey.getIdentifier(),
            },
            response: result,
        });

        await expect(fetcher.fetch(slotId)).resolves.toEqual(result);
    });

    it('should fetch static content for the specified slot version', async () => {
        const fetcher = new ContentFetcher({
            apiKey: apiKeyIdentifier,
        });

        const options: FetchOptions = {
            static: true,
            version: 2,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/static-content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': apiKey.getIdentifier(),
            },
            body: {
                ...requestMatcher.body,
                version: `${options.version}`,
            },
            response: result,
        });

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should fetch static content for the specified preferred locale', async () => {
        const fetcher = new ContentFetcher({
            apiKey: apiKeyIdentifier,
        });

        const options: FetchOptions = {
            static: true,
            preferredLocale: 'en-US',
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/static-content`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': apiKey.getIdentifier(),
            },
            body: {
                ...requestMatcher.body,
                preferredLocale: options.preferredLocale,
            },
            response: result,
        });

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should fetch dynamic content using the provided client ID', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const clientId = 'c3b5b9f0-5f9a-4b3c-8c9c-8b5c8b5c8b5c';

        const options: FetchOptions = {
            clientId: clientId,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Id': clientId,
            },
            response: result,
        });

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should fetch dynamic content passing the provided client IP', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const clientIp = '192.168.0.1';

        const options: FetchOptions = {
            clientIp: clientIp,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Ip': clientIp,
            },
            response: result,
        });

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should fetch dynamic content passing the provided client agent', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

        const options: FetchOptions = {
            clientAgent: userAgent,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Agent': userAgent,
            },
            response: result,
        });

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should fetch dynamic content using the provided user token', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const fetcher = new ContentFetcher({
            appId: appId,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Token': token.toString(),
            },
            response: result,
        });

        const options: FetchOptions = {
            userToken: token,
        };

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should fetch dynamic content using the provided preview token', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const fetcher = new ContentFetcher({
            appId: appId,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                previewToken: token.toString(),
            },
            response: result,
        });

        const options: FetchOptions = {
            previewToken: token,
        };

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should not include the schema if not requested', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: result,
        });

        const options: FetchOptions = {
            includeSchema: false,
        };

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(result);
    });

    it('should fetch content including the schema', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const resultWithSchema: FetchResponse = {
            ...result,
            metadata: {
                ...result.metadata,
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {},
                    },
                    definitions: {},
                },
            },
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                includeSchema: true,
            },
            response: resultWithSchema,
        });

        const options: FetchOptions = {
            includeSchema: true,
        };

        await expect(fetcher.fetch(slotId, options)).resolves.toEqual(resultWithSchema);
    });

    it('should fetch using the extra options', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        fetchMock.mockGlobal().route({
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

        await fetcher.fetch(slotId, {extra: extraOptions as FetchOptions['extra']});

        const lastCall = fetchMock.callHistory.lastCall();

        expect(lastCall).toBeDefined();
        expect(lastCall!.options).toEqual(expect.objectContaining(overridableOptions));
        expect(lastCall!.options).not.toEqual(expect.objectContaining(nonOverridableOptions));
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

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            delay: 20,
            response: {
                result: 'Carol',
            },
        });

        const promise = fetcher.fetch(slotId, {
            timeout: 10,
        });

        jest.advanceTimersByTime(11);

        const calls = fetchMock.callHistory.lastCall();

        expect(calls).toBeDefined();

        const fetchOptions = calls!.options;

        expect(fetchOptions?.signal).toBeDefined();

        await expect(promise).rejects.toThrow(ContentError);

        await expect(promise).rejects.toHaveProperty('response', {
            title: `Content could not be loaded in time for slot '${slotId}'.`,
            type: ContentErrorType.TIMEOUT,
            detail: 'The content took more than 10ms to load.',
            status: 408,
        });

        expect(fetchOptions!.signal!.aborted).toBe(true);

        expect(logger.error).toHaveBeenCalledWith(Help.forStatusCode(408));
    });

    it('should use the default timeout if none is specified', async () => {
        jest.useFakeTimers();

        const fetcher = new ContentFetcher({
            appId: appId,
            defaultTimeout: 10,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            delay: 20,
            response: {
                result: 'Carol',
            },
        });

        const promise = fetcher.fetch(slotId);

        jest.advanceTimersByTime(11);

        await expect(promise).rejects.toThrow(ContentError);

        await expect(promise).rejects.toHaveProperty('response', {
            title: `Content could not be loaded in time for slot '${slotId}'.`,
            type: ContentErrorType.TIMEOUT,
            detail: 'The content took more than 10ms to load.',
            status: 408,
        });
    });

    it('should not log a timeout error message when request completes before the timeout', async () => {
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
            defaultTimeout: 10,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                result: 'Carol',
            },
        });

        await fetcher.fetch(slotId);

        jest.advanceTimersByTime(11);

        expect(logger.error).not.toHaveBeenCalled();
    });

    it('should reject with a suspended service error when the response status is 202', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: 202,
                body: '',
            },
        });

        const promise = fetcher.fetch(slotId);

        await expect(promise).rejects.toThrow(ContentError);
        await expect(promise.catch((error: ContentError) => error.response)).resolves.toStrictEqual({
            status: 202,
            type: ContentErrorType.SUSPENDED_SERVICE,
            title: 'Service is suspended.',
            detail: Help.forStatusCode(202),
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

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                context: context,
            },
            response: result,
        });

        const promise = fetcher.fetch(slotId, {context: context});

        await expect(promise).resolves.toEqual(result);
    });

    it('should fetch dynamic content for the specified slot version', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const version = 2;

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                version: `${version}`,
            },
            response: result,
        });

        const promise = fetcher.fetch(slotId, {version: version});

        await expect(promise).resolves.toEqual(result);
    });

    it('should fetch dynamic content for the default preferred locale', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
            defaultPreferredLocale: 'en-us',
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                preferredLocale: 'en-us',
            },
            response: result,
        });

        const promise = fetcher.fetch(slotId);

        await expect(promise).resolves.toEqual(result);
    });

    it('should fetch dynamic content for the specified preferred locale', async () => {
        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const preferredLocale = 'pt-br';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                preferredLocale: preferredLocale,
            },
            response: result,
        });

        const promise = fetcher.fetch(slotId, {preferredLocale: preferredLocale});

        await expect(promise).resolves.toEqual(result);
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

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: 400,
                body: response,
            },
        });

        const promise = fetcher.fetch(slotId);

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

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: 500,
                body: 'Invalid JSON payload',
            },
        });

        const promise = fetcher.fetch(slotId);

        await expect(promise).rejects.toThrow(ContentError);
        await expect(promise).rejects.toHaveProperty('response', response);
    });

    it('should catch unexpected error responses', async () => {
        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                body: 'Invalid JSON payload',
            },
        });

        const fetcher = new ContentFetcher({
            appId: appId,
        });

        const response: ErrorResponse = {
            title: 'Unknown error',
            type: ContentErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        const promise = fetcher.fetch(slotId);

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

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                throws: new Error(response.title),
            },
        });

        const promise = fetcher.fetch(slotId);

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

        fetchMock.mockGlobal().route({
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

        const promise = fetcher.fetch(slotId);

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

        const region = 'us-central1';
        const processingTime = 120.1234;

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: 200,
                body: result,
                headers: {
                    'X-Croct-Region': region,
                    'X-Croct-Timing': processingTime,
                },
            },
        });

        await fetcher.fetch(slotId);

        expect(logger.debug).toHaveBeenCalledWith(
            `Content for slot '${slotId}' processed by region ${region} in ${processingTime}.`,
        );
    });

    it('should not be serializable', () => {
        expect(() => {
            new ContentFetcher({appId: appId}).toJSON();
        }).toThrowWithMessage(Error, 'Unserializable value.');
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
