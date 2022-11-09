import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import {
    Evaluator,
    ErrorResponse,
    EvaluationContext,
    EvaluationError,
    EvaluationErrorType,
    QueryError,
    QueryErrorResponse,
    EvaluationOptions,
} from '../src/evaluator';
import {Token} from '../src/token';
import {EVALUATION_ENDPOINT_URL} from '../src/constants';

jest.mock('../src/constants', () => ({
    ...jest.requireActual('../src/constants'),
    MAX_QUERY_LENGTH: 30,
    EVALUATION_ENDPOINT_URL: 'https://evaluation.example.com',
}));

describe('An evaluator', () => {
    const appId = '06e3d5fb-cdfd-4270-8eba-de7a7bb04b5f';
    const apiKey = '00000000-0000-0000-0000-000000000000';
    const query = 'user\'s name';
    const requestMatcher: MockOptions = {
        method: 'POST',
        body: {
            query: query,
        },
    };

    afterEach(() => {
        fetchMock.reset();
        jest.clearAllMocks();
    });

    test('should require either an application ID or API key', async () => {
        await expect(() => new Evaluator({}))
            .toThrow(new Error('Either the application ID or the API key must be provided.'));
    });

    test('should require either an application ID or API key, but not both', async () => {
        await expect(() => new Evaluator({apiKey: apiKey, appId: appId}))
            .toThrow(new Error('Either the application ID or the API key must be provided.'));
    });

    test('should use the specified base endpoint', async () => {
        const customEndpoint = 'https://custom.example.com';

        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: customEndpoint,
        });

        const result = 'Anonymous';

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${customEndpoint}/client/web/evaluate`,
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe(result);
    });

    test('should use the external endpoint when specifying an API key', async () => {
        const evaluator = new Evaluator({
            apiKey: apiKey,
        });

        const result = 'Anonymous';

        fetchMock.mock({
            ...requestMatcher,
            matcher: `${EVALUATION_ENDPOINT_URL}/external/web/evaluate`,
            headers: {
                'X-Api-Key': apiKey,
            },
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(query)).resolves.toBe(result);
    });

    test('should evaluate queries without token when not provided', async () => {
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

    test('should evaluate queries using the provided token', async () => {
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

    test('should evaluate queries using the provided client ID', async () => {
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

    test('should fetch using the extra options', async () => {
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

    test('should abort the evaluation if the timeout is reached', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        fetchMock.mock({
            ...requestMatcher,
            delay: 20,
            response: {
                result: 'Carol',
            },
        });

        const promise = evaluator.evaluate(query, {
            timeout: 10,
        });

        const fetchOptions = fetchMock.lastOptions() as MockOptions & {signal: AbortSignal} | undefined;

        expect(fetchOptions?.signal).toBeDefined();

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toThrow(expect.objectContaining({
            response: {
                title: 'Maximum evaluation timeout reached before evaluation could complete.',
                type: EvaluationErrorType.TIMEOUT,
                detail: 'The evaluation took more than 10ms to complete.',
                status: 408,
            },
        }));

        expect(fetchOptions?.signal.aborted).toBe(true);
    });

    test('should evaluate queries using the provided context', async () => {
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

    test('should report errors if the evaluation fails', async () => {
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
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    test.each([
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
            await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
        },
    );

    test('should report an query error if the query exceeds the maximum allowed length', async () => {
        const evaluator = new Evaluator({
            appId: appId,
        });

        const length = Evaluator.MAX_QUERY_LENGTH + 1;
        const response: QueryErrorResponse = {
            title: 'The query is too complex.',
            status: 422,
            type: EvaluationErrorType.TOO_COMPLEX_QUERY,
            detail: `The query must be at most ${Evaluator.MAX_QUERY_LENGTH} `
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
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    test('should report unexpected errors when the cause of the evaluation failure is unknown', async () => {
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
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    test('should not be serializable', async () => {
        expect(() => new Evaluator({appId: appId}).toJSON())
            .toThrow(new Error('Unserializable value.'));
    });
});

describe('An evaluation error', () => {
    test('should have a response', () => {
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
    test('should have a response', () => {
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
