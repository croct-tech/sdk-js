import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import {
    ErrorResponse,
    EvaluationContext,
    EvaluationError,
    EvaluationErrorType,
    EvaluationOptions,
    Evaluator,
    QueryError,
    QueryErrorResponse,
} from '../src/evaluator';
import {Token} from '../src/token';
import {BASE_ENDPOINT_URL, CLIENT_LIBRARY} from '../src/constants';
import {ApiKey} from '../src/apiKey';
import {Logger} from '../src/logging';
import {Help} from '../src/help';

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
    const parsedApiKey = ApiKey.of(
        '00000000-0000-0000-0000-000000000000',
        'ES256;MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg3TbbvRM7DNwxY3XGWDmlSRPSfZ9b+ch9TO3jQ6'
        + '8Zyj+hRANCAASmJj/EiEhUaLAWnbXMTb/85WADkuFgoELGZ5ByV7YPlbb2wY6oLjzGkpF6z8iDrvJ4kV6EhaJ4n0HwSQckVLNE',
    );
    const plainTextApiKey = parsedApiKey.getIdentifier();

    const query = 'user\'s name';
    const requestMatcher: MockOptions = {
        functionMatcher: (_, req) => req.mode === 'cors',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-Library': CLIENT_LIBRARY,
        },
        body: {
            query: query,
        },
    };

    afterEach(() => {
        jest.useRealTimers();
        fetchMock.reset();
        jest.clearAllMocks();
    });

    it('should require either an application ID or API key', async () => {
        await expect(() => new Evaluator({}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should require either an application ID or API key, but not both', async () => {
        await expect(() => new Evaluator({apiKey: plainTextApiKey, appId: appId}))
            .toThrowWithMessage(Error, 'Either the application ID or the API key must be provided.');
    });

    it('should use the specified base endpoint', async () => {
        const customEndpoint = 'https://custom.example.com';

        const evaluator = new Evaluator({
            appId: appId,
            baseEndpointUrl: customEndpoint,
        });

        const result = 'Anonymous';

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${customEndpoint}/client/web/evaluate`,
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe(result);
    });

    it.each<[string, string|ApiKey]>([
        ['an API key', parsedApiKey],
        ['an plain-text API key', plainTextApiKey],
    ])('should use the external endpoint for static content passing %s', async (_, apiKey) => {
        const evaluator = new Evaluator({
            apiKey: apiKey,
        });

        const result = 'Anonymous';

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${BASE_ENDPOINT_URL}/external/web/evaluate`,
            headers: {
                ...requestMatcher.headers,
                'X-Api-Key': parsedApiKey.getIdentifier(),
            },
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe(result);
    });

    it('should evaluate queries without token when not provided', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const result = 'Anonymous';

        fetchMock.mock({
            ...requestMatcher,
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe(result);
    });

    it('should evaluate queries using the provided token', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const evaluator = new Evaluator({
            appId: appId,
        });

        const result = 'Carol';

        fetchMock.mock({
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

        fetchMock.mock({
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

        fetchMock.mock({
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

        fetchMock.mock({
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

        fetchMock.mock({
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

        expect(fetchMock.lastOptions()).toEqual(expect.objectContaining(overridableOptions));
        expect(fetchMock.lastOptions()).not.toEqual(expect.objectContaining(nonOverridableOptions));
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

        fetchMock.mock({
            ...requestMatcher,
            delay: 20,
            response: JSON.stringify('Carol'),
        });

        const promise = evaluator.evaluate(query, {
            timeout: 10,
        });

        jest.advanceTimersByTime(10);

        const fetchOptions = fetchMock.lastOptions() as MockOptions & {signal: AbortSignal} | undefined;

        expect(fetchOptions?.signal).toBeDefined();

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toHaveProperty('response', {
            title: 'Evaluation could not be completed in time for query "user\'s name".',
            type: EvaluationErrorType.TIMEOUT,
            detail: 'The evaluation took more than 10ms to complete.',
            status: 408,
        });

        expect(fetchOptions?.signal.aborted).toBe(true);
        expect(logger.error).toHaveBeenCalledWith(Help.forStatusCode(408));
    });

    it('should use the default timeout if none is specified', async () => {
        jest.useFakeTimers();

        const evaluator = new Evaluator({
            appId: appId,
            defaultTimeout: 10,
        });

        fetchMock.mock({
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

        fetchMock.mock({
            ...requestMatcher,
            response: JSON.stringify('Carol'),
        });

        await expect(evaluator.evaluate(query, {timeout: 10})).resolves.toBe('Carol');

        jest.advanceTimersByTime(11);

        expect(logger.error).not.toHaveBeenCalled();
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

        fetchMock.mock({
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

        const response: ErrorResponse = {
            type: EvaluationErrorType.UNALLOWED_RESULT,
            title: 'Error title',
            status: 400,
        };

        fetchMock.mock({
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
        [EvaluationErrorType.TOO_COMPLEX_QUERY],
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

            fetchMock.mock({
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

        const response: ErrorResponse = {
            title: 'Error 500 - Internal Server Error',
            type: EvaluationErrorType.UNEXPECTED_ERROR,
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

        const promise = evaluator.evaluate(query);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toHaveProperty('response', response);
    });

    it('should catch unexpected error responses', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const response: ErrorResponse = {
            title: `Invalid json response body at ${BASE_ENDPOINT_URL}/client/web/evaluate reason: `
                + 'Unexpected token \'I\', "Invalid JSON payload" is not valid JSON',
            type: EvaluationErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        fetchMock.mock({
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

        const response: ErrorResponse = {
            title: 'Network error.',
            type: EvaluationErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        fetchMock.mock({
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

        const evaluator = new Evaluator({
            appId: appId,
            logger: logger,
        });

        const response: ErrorResponse = {
            title: scenario.title,
            type: EvaluationErrorType.UNEXPECTED_ERROR,
            status: scenario.status,
        };

        fetchMock.mock({
            ...requestMatcher,
            response: {
                status: scenario.status,
                body: response,
            },
        });

        const promise = evaluator.evaluate(query);

        await expect(promise).rejects.toThrowWithMessage(EvaluationError, scenario.title);

        const help = Help.forStatusCode(scenario.status);

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

        fetchMock.mock({
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
        expect(() => new Evaluator({appId: appId}).toJSON())
            .toThrowWithMessage(Error, 'Unserializable value.');
    });
});

describe('An evaluation error', () => {
    it('should have a response', () => {
        const response: ErrorResponse = {
            type: EvaluationErrorType.UNALLOWED_RESULT,
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
