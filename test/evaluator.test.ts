import type {CallLog, UserRouteConfig} from 'fetch-mock';
import fetchMock from 'fetch-mock';
import type {Configuration, EvaluationOptions, QueryErrorResponse} from '../src/evaluator';
import {
    EvaluationContext,
    EvaluationError,
    EvaluationErrorType,
    Evaluator as BaseEvaluator,
    QueryError,
} from '../src/evaluator';
import type {ApiProblem} from '../src/error';
import {Token} from '../src/token';
import {BASE_ENDPOINT_URL} from '../src/constants';
import {ApiKey} from '../src/apiKey';
import type {Logger} from '../src/logging';
import {Help} from '../src/help';

class Evaluator extends BaseEvaluator {
    public constructor(configuration: Omit<Configuration, 'clientLibrary'> & {clientLibrary?: string}) {
        super({clientLibrary: 'Plug JS 1.0.0; SDK JS 1.0.0', ...configuration});
    }
}

jest.mock(
    '../src/constants',
    () => ({
        ...jest.requireActual('../src/constants'),
        MAX_QUERY_LENGTH: 30,
        BASE_ENDPOINT_URL: 'https://evaluation.example.com',
        ClIENT_LIBRARY: 'Plug v1.0.0',
    }),
);

describe('An evaluator', () => {
    const appId = '06e3d5fb-cdfd-4270-8eba-de7a7bb04b5f';
    const apiKey = ApiKey.parse(
        '00000000-0000-0000-0000-000000000000:ES256;'
        + 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg3TbbvRM7DNwxY3XGWDmlSRPSfZ9b+ch9TO3jQ68Zyj+'
        + 'hRANCAASmJj/EiEhUaLAWnbXMTb/85WADkuFgoELGZ5ByV7YPlbb2wY6oLjzGkpF6z8iDrvJ4kV6EhaJ4n0HwSQckVLNE',
    );
    const apiKeyIdentifier = apiKey.getIdentifier();
    const plainTextApiKey = `${apiKey.getIdentifier()}:${apiKey.getPrivateKey()}`;

    const query = 'user\'s name';
    const requestMatcher: UserRouteConfig = {
        matcherFunction: (callLog: CallLog) => callLog?.options.mode === 'cors',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: {
            query: query,
        },
    };

    beforeEach(() => {
        fetchMock.removeRoutes();
        fetchMock.clearHistory();
    });

    afterEach(() => {
        jest.useRealTimers();
        fetchMock.unmockGlobal();
        jest.clearAllMocks();
    });

    it('should require either an application ID or API key', () => {
        expect(() => new Evaluator({}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should require either an application ID or API key, but not both', () => {
        expect(() => new Evaluator({apiKey: apiKeyIdentifier, appId: appId}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should use the specified base endpoint', async () => {
        const customEndpoint = 'https://custom.example.com';
        const clientLibrary = 'Plug JS 1.0.0; SDK JS 1.0.0';

        const evaluator = new Evaluator({
            appId: appId,
            baseEndpointUrl: customEndpoint,
            clientLibrary: clientLibrary,
        });

        const result = 'Anonymous';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            matcher: `${customEndpoint}/client/web/evaluate`,
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe(result);

        expect(new Headers(fetchMock.callHistory.calls()[0].options.headers).get('X-Client-Library'))
            .toBe(clientLibrary);
    });

    it.each<[string, string | ApiKey]>([
        ['an API key', apiKey],
        ['an plain-text API key identifier', apiKeyIdentifier],
        ['an plain-text API key', plainTextApiKey],
    ])('should use the external endpoint for static content passing %s', async (_, value) => {
        const evaluator = new Evaluator({
            apiKey: value,
        });

        const result = 'Anonymous';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/evaluate`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': apiKey.getIdentifier(),
            },
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe(result);
    });

    it('should evaluate queries without token when not provided', async () => {
        const evaluator = new Evaluator({
            appId: appId,
            clientLibrary: 'Plug JS 1.0.0; SDK JS 1.0.0',
        });

        const result = 'Anonymous';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe(result);
    });

    it('should use the configured client library', async () => {
        const evaluator = new Evaluator({
            appId: appId,
            clientLibrary: 'Plug JS 1.0.0; SDK JS 1.0.0',
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {...requestMatcher.headers, 'X-Client-Library': 'Plug JS 1.0.0; SDK JS 1.0.0'},
            response: JSON.stringify('Anonymous'),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe('Anonymous');
    });

    it('should evaluate queries using the provided token', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const evaluator = new Evaluator({
            appId: appId,
            clientLibrary: 'Plug JS 1.0.0; SDK JS 1.0.0',
        });

        const result = 'Carol';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Token': token.toString(),
            },
            response: JSON.stringify(result),
        });

        const options: EvaluationOptions = {
            userToken: token,
        };

        await expect(evaluator.evaluate(query, options)).resolves.toBe(result);
    });

    it('should evaluate queries using the provided client ID', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const clientId = 'c3b5b9f0-5f9a-4b3c-8c9c-8b5c8b5c8b5c';

        const result = 'Carol';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Id': clientId,
            },
            response: JSON.stringify(result),
        });

        const options: EvaluationOptions = {
            clientId: clientId,
        };

        await expect(evaluator.evaluate(query, options)).resolves.toBe(result);
    });

    it('should evaluate queries using the provided client IP', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const clientIp = '192.168.0.1';

        const result = 'Carol';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-IP': clientIp,
            },
            response: JSON.stringify(result),
        });

        const options: EvaluationOptions = {
            clientIp: clientIp,
        };

        await expect(evaluator.evaluate(query, options)).resolves.toBe(result);
    });

    it('should evaluate queries using the provided user agent', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

        const result = 'Carol';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            headers: {
                ...requestMatcher.headers,
                'X-Client-Agent': userAgent,
            },
            response: JSON.stringify(result),
        });

        const options: EvaluationOptions = {
            clientAgent: userAgent,
        };

        await expect(evaluator.evaluate(query, options)).resolves.toBe(result);
    });

    it('should fetch using the extra options', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const result = 'Carol';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: JSON.stringify(result),
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

        await evaluator.evaluate(query, {extra: extraOptions as EvaluationOptions['extra']});

        const calls = fetchMock.callHistory.lastCall();

        expect(calls).toBeDefined();
        expect(calls!.options).toEqual(expect.objectContaining(overridableOptions));
        expect(calls!.options).not.toEqual(expect.objectContaining(nonOverridableOptions));
    });

    it('should abort the evaluation if the timeout is reached', async () => {
        jest.useFakeTimers();

        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const evaluator = new Evaluator({
            appId: appId,
            logger: logger,
            // Ensure the specified timeout has precedence over the default timeout
            defaultTimeout: 15,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            delay: 20,
            response: JSON.stringify('Carol'),
        });

        const promise = evaluator.evaluate(query, {
            timeout: 10,
        });

        jest.advanceTimersByTime(10);

        const lastCall = fetchMock.callHistory.lastCall();

        expect(lastCall).toBeDefined();
        const fetchOptions = lastCall!.options;

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toHaveProperty('response', {
            title: 'Evaluation could not be completed in time for query "user\'s name".',
            type: EvaluationErrorType.TIMEOUT,
            detail: 'The evaluation took more than 10ms to complete.',
            status: 408,
        });

        expect(fetchOptions.signal).toBeDefined();
        expect(fetchOptions.signal!.aborted).toBe(true);
        expect(logger.error).toHaveBeenCalledWith(Help.forStatusCode(408));
    });

    it('should use the default timeout if none is specified', async () => {
        jest.useFakeTimers();

        const evaluator = new Evaluator({
            appId: appId,
            defaultTimeout: 10,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            delay: 20,
            response: JSON.stringify('Carol'),
        });

        const promise = evaluator.evaluate(query);

        jest.advanceTimersByTime(10);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toHaveProperty('response', {
            title: 'Evaluation could not be completed in time for query "user\'s name".',
            type: EvaluationErrorType.TIMEOUT,
            detail: 'The evaluation took more than 10ms to complete.',
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

        const evaluator = new Evaluator({
            appId: appId,
            logger: logger,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: JSON.stringify('Carol'),
        });

        await expect(evaluator.evaluate(query, {timeout: 10})).resolves.toBe('Carol');

        jest.advanceTimersByTime(11);

        expect(logger.error).not.toHaveBeenCalled();
    });

    it('should reject with a suspended service error when the response status is 204', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: 202,
                body: '',
            },
        });

        const promise = evaluator.evaluate(query);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise.catch((error: EvaluationError) => error.response)).resolves.toEqual({
            status: 202,
            type: EvaluationErrorType.SUSPENDED_SERVICE,
            title: 'Service is suspended.',
            detail: Help.forStatusCode(202),
        });
    });

    it('should evaluate queries using the provided context', async () => {
        const evaluator = new Evaluator({
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

        const result = 'Carol';

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            body: {
                ...requestMatcher.body,
                context: context,
            },
            response: JSON.stringify(result),
        });

        const promise = evaluator.evaluate(query, {context: context});

        await expect(promise).resolves.toBe(result);
    });

    it('should report errors if the evaluation fails', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const response: ApiProblem = {
            type: EvaluationErrorType.INTERNAL_ERROR,
            title: 'Error title',
            status: 400,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: 400,
                body: JSON.stringify(response),
            },
        });

        const promise = evaluator.evaluate(query);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toHaveProperty('response', response);
    });
    it.each([
        [EvaluationErrorType.EVALUATION_FAILED],
        [EvaluationErrorType.INVALID_QUERY],
    ])(
        'should report an query error if the error that can be traced back to the offending input (%s)',
        async (errorType: EvaluationErrorType) => {
            const evaluator = new Evaluator({
                appId: appId,
            });

            const response: QueryErrorResponse = {
                type: errorType,
                title: 'Error title',
                status: 422,
                errors: [{
                    cause: 'The reason for the error.',
                    location: {
                        start: {
                            index: 0,
                            line: 1,
                            column: 0,
                        },
                        end: {
                            index: 10,
                            line: 1,
                            column: 10,
                        },
                    },
                }],
            };

            fetchMock.mockGlobal().route({
                ...requestMatcher,
                response: {
                    status: response.status,
                    body: JSON.stringify(response),
                },
            });

            const promise = evaluator.evaluate(query);

            await expect(promise).rejects.toThrow(QueryError);
            await expect(promise).rejects.toHaveProperty('response', response);
        },
    );

    it('should report an query error if the query exceeds the maximum allowed length', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const length = Evaluator.MAX_QUERY_LENGTH + 1;
        const response: QueryErrorResponse = {
            title: 'The query is too complex.',
            status: 422,
            type: EvaluationErrorType.TOO_COMPLEX_QUERY,
            detail: `The query "____________________..." must be at most ${Evaluator.MAX_QUERY_LENGTH} `
                + `characters long, but it is ${length} characters long.`,
            errors: [{
                cause: 'The query is longer than expected.',
                location: {
                    start: {
                        index: 0,
                        line: 1,
                        column: 0,
                    },
                    end: {
                        index: length - 1,
                        line: 1,
                        column: length - 1,
                    },
                },
            }],
        };

        const promise = evaluator.evaluate('_'.repeat(length));

        await expect(promise).rejects.toThrow(QueryError);
        await expect(promise).rejects.toHaveProperty('response', response);
    });

    it('should catch deserialization errors', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const response: ApiProblem = {
            title: 'Error 500 - Internal Server Error',
            type: EvaluationErrorType.INTERNAL_ERROR,
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

        const promise = evaluator.evaluate(query);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toHaveProperty('response', response);
    });

    it('should catch unexpected error responses', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const response: ApiProblem = {
            title: 'Unknown error',
            type: EvaluationErrorType.INTERNAL_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                body: 'Invalid JSON payload',
            },
        });

        const promise = evaluator.evaluate(query);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise.catch((error: EvaluationError) => error.response)).resolves.toEqual(response);
    });

    it('should report unexpected errors when the cause of the evaluation failure is unknown', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const response: ApiProblem = {
            title: 'Network error.',
            type: EvaluationErrorType.INTERNAL_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                throws: new Error(response.title),
            },
        });

        const promise = evaluator.evaluate(query);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toHaveProperty('response', response);
    });

    type HelpScenario = {
        status: number,
        type: string,
        title: string,
    };

    it.each<HelpScenario>([
        {
            status: 401,
            type: 'https://croct.help/api/evaluation/some-error',
            title: 'Unauthorized request',
        },
        {
            status: 403,
            type: 'https://croct.help/api/authentication/quota-exceeded',
            title: 'Quota exceeded',
        },
        {
            status: 403,
            type: 'https://croct.help/api/authentication/forbidden-origin',
            title: 'Unallowed origin',
        },
    ])('should log help messages for the API problem $type', async scenario => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const evaluator = new Evaluator({
            appId: appId,
            logger: logger,
        });

        const response: ApiProblem = {
            title: scenario.title,
            type: scenario.type,
            status: scenario.status,
        };

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: scenario.status,
                body: response,
            },
        });

        const promise = evaluator.evaluate(query);

        await expect(promise).rejects.toThrowWithMessage(EvaluationError, scenario.title);

        const help = Help.forApiProblem(response);

        expect(help).toBeDefined();

        expect(logger.error).toHaveBeenCalledWith(help);
    });

    it('should log the region and processing time', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const evaluator = new Evaluator({
            appId: appId,
            logger: logger,
        });

        const result = true;
        const region = 'us-central1';
        const timing = 120.1234;

        fetchMock.mockGlobal().route({
            ...requestMatcher,
            response: {
                status: 200,
                body: JSON.stringify(result),
                headers: {
                    'X-Croct-Region': 'us-central1',
                    'X-Croct-Timing': '120.1234ms',
                },
            },
        });

        await evaluator.evaluate(query);

        expect(logger.debug).toHaveBeenCalledWith(
            `Evaluation of the query "${query}" processed by region ${region} in ${timing}ms.`,
        );
    });

    it('should not be serializable', () => {
        expect(() => {
            new Evaluator({appId: appId}).toJSON();
        }).toThrowWithMessage(Error, 'Unserializable value.');
    });
});

describe('An evaluation context', () => {
    const timeZone = 'America/Sao_Paulo';

    beforeEach(() => {
        window.history.replaceState({}, '', 'http://localhost/');

        window.document.title = '';

        setReferrer('');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function setReferrer(referrer: string): void {
        Object.defineProperty(window.document, 'referrer', {
            value: referrer,
            configurable: true,
        });
    }

    function sanitizeToken(url: string): URL {
        const sanitized = new URL(url);

        sanitized.searchParams.delete('token');

        return sanitized;
    }

    function setTimeZone(zone: string): void {
        jest.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
            .mockReturnValue({timeZone: zone} as Intl.ResolvedDateTimeFormatOptions);
    }

    it('should describe the page currently open in the browser', () => {
        setTimeZone(timeZone);
        setReferrer('http://referrer.com/');

        window.history.replaceState({}, '', 'http://localhost/products/1?foo=bar');

        window.document.title = 'Product 1';

        expect(EvaluationContext.createPageContext()).toEqual({
            page: {
                url: 'http://localhost/products/1?foo=bar',
                title: 'Product 1',
                referrer: 'http://referrer.com/',
            },
            timeZone: timeZone,
        });
    });

    it('should omit the title and the referrer when the page has none', () => {
        setTimeZone(timeZone);

        expect(EvaluationContext.createPageContext()).toEqual({
            page: {url: 'http://localhost/'},
            timeZone: timeZone,
        });
    });

    it('should omit the time zone when it cannot be detected', () => {
        setTimeZone('Etc/Unknown');

        expect(EvaluationContext.createPageContext()).not.toHaveProperty('timeZone');
    });

    it('should extend the captured page with the provided one', () => {
        setTimeZone(timeZone);
        setReferrer('http://referrer.com/');

        window.document.title = 'Product 1';

        const context = EvaluationContext.createPageContext({
            page: {url: 'http://localhost/products/2'},
        });

        expect(context).toEqual({
            page: {
                url: 'http://localhost/products/2',
                title: 'Product 1',
                referrer: 'http://referrer.com/',
            },
            timeZone: timeZone,
        });
    });

    it('should give precedence to the provided values', () => {
        setTimeZone(timeZone);
        setReferrer('http://referrer.com/');

        window.document.title = 'Product 1';

        const context = EvaluationContext.createPageContext({
            page: {
                url: 'http://localhost/products/2',
                title: 'Product 2',
                referrer: 'http://google.com/',
            },
            timeZone: 'Europe/Lisbon',
        });

        expect(context).toEqual({
            page: {
                url: 'http://localhost/products/2',
                title: 'Product 2',
                referrer: 'http://google.com/',
            },
            timeZone: 'Europe/Lisbon',
        });
    });

    it('should normalize the URL of the page', () => {
        expect(EvaluationContext.createPageContext({page: {url: 'http://localhost'}}).page.url)
            .toBe('http://localhost/');
    });

    it('should reject a relative URL', () => {
        // The error comes from the realm of the document, so only the message is checked
        expect(() => EvaluationContext.createPageContext({page: {url: '/products/1'}}))
            .toThrow('Invalid URL');
    });

    it('should sanitize the captured URL and referrer', () => {
        setReferrer('http://referrer.com/?token=secret&foo=bar');

        window.history.replaceState({}, '', 'http://localhost/products/1?token=secret&foo=bar');

        const context = EvaluationContext.createPageContext({}, {urlSanitizer: sanitizeToken});

        expect(context.page).toEqual({
            url: 'http://localhost/products/1?foo=bar',
            referrer: 'http://referrer.com/?foo=bar',
        });
    });

    it('should sanitize the provided URL and referrer', () => {
        const context = EvaluationContext.createPageContext(
            {
                page: {
                    url: 'http://localhost/products/2?token=secret&foo=bar',
                    referrer: 'http://google.com/?token=secret',
                },
            },
            {urlSanitizer: sanitizeToken},
        );

        expect(context.page).toEqual({
            url: 'http://localhost/products/2?foo=bar',
            referrer: 'http://google.com/',
        });
    });

    it('should report the campaign and the attributes', () => {
        setTimeZone(timeZone);

        const context = EvaluationContext.createPageContext({
            page: {url: 'http://localhost/'},
            campaign: {name: 'black-friday'},
            attributes: {plan: 'pro'},
        });

        expect(context).toEqual({
            page: {url: 'http://localhost/'},
            campaign: {name: 'black-friday'},
            attributes: {plan: 'pro'},
            timeZone: timeZone,
        });
    });

    it('should omit empty attributes', () => {
        setTimeZone(timeZone);

        const context = EvaluationContext.createPageContext({
            page: {url: 'http://localhost/'},
            attributes: {},
        });

        expect(context).not.toHaveProperty('attributes');
    });
});

describe('An evaluation error', () => {
    it('should have a response', () => {
        const response: ApiProblem = {
            type: EvaluationErrorType.INTERNAL_ERROR,
            title: 'Error title',
            status: 400,
        };

        const error = new EvaluationError(response);

        expect(error.response).toEqual(response);
    });
});

describe('An query error', () => {
    it('should have a response', () => {
        const response: QueryErrorResponse = {
            type: EvaluationErrorType.TIMEOUT,
            title: 'Error title',
            status: 422,
            errors: [{
                cause: 'The reason for the error.',
                location: {
                    start: {
                        index: 0,
                        line: 1,
                        column: 0,
                    },
                    end: {
                        index: 10,
                        line: 1,
                        column: 10,
                    },
                },
            }],
        };

        const error = new QueryError(response);

        expect(error.response).toEqual(response);
    });
});
