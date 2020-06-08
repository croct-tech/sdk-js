import * as fetchMock from 'fetch-mock';
import {MockOptions} from 'fetch-mock';
import Evaluator, {
    ErrorResponse,
    EvaluationContext,
    EvaluationError,
    EvaluationErrorType,
    ExpressionError,
    ExpressionErrorResponse,
} from '../src/evaluator';
import Token, {FixedTokenProvider} from '../src/token';
import CidAssigner from '../src/cid';
import FixedCidAssigner from '../src/cid/fixedCidAssigner';

jest.mock('../src/constants', () => ({
    MAX_EXPRESSION_LENGTH: 30,
}));

describe('An evaluator', () => {
    const endpoint = 'https://croct.io/evaluate';
    const appId = '06e3d5fb-cdfd-4270-8eba-de7a7bb04b5f';
    const expression = 'user\'s name';
    const requestMatcher: MockOptions = {
        matcher: endpoint,
        method: 'GET',
        query: {
            expression: expression,
        },
        headers: {
            'X-App-Id': appId,
            'X-Client-Id': '123',
        },
    };

    afterEach(() => {
        fetchMock.reset();
        jest.clearAllMocks();
    });

    test('should evaluate expressions without token when not provided', async () => {
        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: endpoint,
            tokenProvider: new FixedTokenProvider(null),
            cidAssigner: new FixedCidAssigner('123'),
        });

        const result = 'Anonymous';

        fetchMock.mock({
            ...requestMatcher,
            response: JSON.stringify(result),
        });

        await expect(evaluator.evaluate(expression)).resolves.toBe(result);
    });

    test('should evaluate expressions with token when provided', async () => {
        const token = Token.issue(appId, 'foo', Date.now());

        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: endpoint,
            tokenProvider: new FixedTokenProvider(token),
            cidAssigner: new FixedCidAssigner('123'),
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

        const promise = evaluator.evaluate(expression);

        await expect(promise).resolves.toBe(result);
    });

    test('should abort the evaluation if the timeout is reached', async () => {
        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: endpoint,
            tokenProvider: new FixedTokenProvider(null),
            cidAssigner: new FixedCidAssigner('123'),
        });

        fetchMock.mock({
            ...requestMatcher,
            delay: 20,
            response: {
                result: 'Carol',
            },
        });

        const promise = evaluator.evaluate(expression, {
            timeout: 10,
        });

        await expect(promise).rejects.toThrow(
            new EvaluationError({
                title: 'Maximum evaluation timeout reached before evaluation could complete.',
                type: EvaluationErrorType.TIMEOUT,
                detail: 'The evaluation took more than 10ms to complete.',
                status: 408,
            }),
        );
    });

    test('should evaluate expressions using the provided context', async () => {
        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: endpoint,
            tokenProvider: new FixedTokenProvider(null),
            cidAssigner: new FixedCidAssigner('123'),
        });

        const context: Required<EvaluationContext> = {
            timezone: 'America/Sao_Paulo',
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
            query: {
                ...requestMatcher.query,
                context: JSON.stringify(context),
            },
            response: JSON.stringify(result),
        });

        const promise = evaluator.evaluate(expression, {context: context});

        await expect(promise).resolves.toBe(result);
    });

    test('should report errors if the evaluation fails', async () => {
        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: endpoint,
            tokenProvider: new FixedTokenProvider(null),
            cidAssigner: new FixedCidAssigner('123'),
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

        const promise = evaluator.evaluate(expression);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    test.each([
        [EvaluationErrorType.EVALUATION_FAILED],
        [EvaluationErrorType.INVALID_EXPRESSION],
        [EvaluationErrorType.TOO_COMPLEX_EXPRESSION],
    ])(
        'should report an expression error if the error that can be traced back to the offending input (%s)',
        async (errorType: EvaluationErrorType) => {
            const evaluator = new Evaluator({
                appId: appId,
                endpointUrl: endpoint,
                tokenProvider: new FixedTokenProvider(null),
                cidAssigner: new FixedCidAssigner('123'),
            });

            const response: ExpressionErrorResponse = {
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

            const promise = evaluator.evaluate(expression);

            await expect(promise).rejects.toThrow(ExpressionError);
            await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
        },
    );

    test('should report an expression error if the expression exceeds the maximum allowed length', async () => {
        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: endpoint,
            tokenProvider: new FixedTokenProvider(null),
            cidAssigner: new FixedCidAssigner('123'),
        });

        const length = Evaluator.MAX_EXPRESSION_LENGTH + 1;
        const response: ExpressionErrorResponse = {
            title: 'The expression is too complex.',
            status: 422,
            type: EvaluationErrorType.TOO_COMPLEX_EXPRESSION,
            detail: `The expression must be at most ${Evaluator.MAX_EXPRESSION_LENGTH} `
                + `characters long, but it is ${length} characters long.`,
            errors: [{
                cause: 'The expression is longer than expected.',
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

        await expect(promise).rejects.toThrow(ExpressionError);
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    test('should report unexpected errors when the cause of the evaluation failure is unknown', async () => {
        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: endpoint,
            tokenProvider: new FixedTokenProvider(null),
            cidAssigner: new FixedCidAssigner('123'),
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

        const promise = evaluator.evaluate(expression);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
    });

    test('should report an unexpected error occurring while assigning a CID', async () => {
        const cidAssigner: CidAssigner = {
            assignCid: jest.fn().mockRejectedValue(new Error('Unexpected CID error.')),
        };

        const evaluator = new Evaluator({
            appId: appId,
            endpointUrl: endpoint,
            tokenProvider: new FixedTokenProvider(null),
            cidAssigner: cidAssigner,
        });

        const response: ErrorResponse = {
            title: 'Unexpected CID error.',
            type: EvaluationErrorType.UNEXPECTED_ERROR,
            detail: 'Please try again or contact Croct support if the error persists.',
            status: 500,
        };

        const promise = evaluator.evaluate(expression);

        await expect(promise).rejects.toThrow(EvaluationError);
        await expect(promise).rejects.toEqual(expect.objectContaining({response: response}));
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

describe('An expression error', () => {
    test('should have a response', () => {
        const response: ExpressionErrorResponse = {
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

        const error = new ExpressionError(response);

        expect(error.response).toEqual(response);
    });
});
