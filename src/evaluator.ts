import {JsonObject, JsonValue} from './json';
import {TokenProvider} from './token';
import {EVALUATION_ENDPOINT_URL, MAX_EXPRESSION_LENGTH} from './constants';
import {formatMessage} from './error';
import {getLength, getLocation, Location} from './sourceLocation';

export type Configuration = {
    appId: string,
    endpointUrl?: string,
    tokenProvider: TokenProvider,
}

export type Campaign = {
    name?: string,
    source?: string,
    medium?: string,
    term?: string,
    content?: string,
}

export type Page = {
    title: string,
    url: string,
    referrer?: string,
};

export type EvaluationContext = {
    timezone?: string,
    campaign?: Campaign,
    page?: Page,
    attributes?: JsonObject,
};

export type EvaluationOptions = {
    timeout?: number,
    context?: EvaluationContext,
}

export enum EvaluationErrorType {
    TIMEOUT = 'https://croct.help/api/evaluation#timeout',
    UNEXPECTED_ERROR = 'https://croct.help/api/evaluation#unexpected-error',
    INVALID_EXPRESSION = 'https://croct.help/api/evaluation#invalid-expression',
    TOO_COMPLEX_EXPRESSION = 'https://croct.help/api/evaluation#too-complex-expression',
    EVALUATION_FAILED = 'https://croct.help/api/evaluation#evaluation-failed',
    UNALLOWED_RESULT = 'https://croct.help/api/evaluation#unallowed-result',
    UNSERIALIZABLE_RESULT = 'https://croct.help/api/evaluation#unserializable-result',
}

export type ErrorResponse = {
    type: EvaluationErrorType,
    title: string,
    status: number,
    detail?: string,
}

export class EvaluationError<T extends ErrorResponse = ErrorResponse> extends Error {
    public readonly response: T;

    public constructor(response: T) {
        super(response.title);

        this.response = response;

        Object.setPrototypeOf(this, EvaluationError.prototype);
    }
}

type ExpressionErrorDetail = {
    cause: string,
    location: Location,
}

export type ExpressionErrorResponse = ErrorResponse & {
    errors: ExpressionErrorDetail[],
}

export class ExpressionError extends EvaluationError<ExpressionErrorResponse> {
    public constructor(response: ExpressionErrorResponse) {
        super(response);

        Object.setPrototypeOf(this, ExpressionError.prototype);
    }
}

export default class Evaluator {
    public static readonly MAX_EXPRESSION_LENGTH = MAX_EXPRESSION_LENGTH;

    private readonly configuration: Required<Configuration>;

    public constructor(configuration: Configuration) {
        this.configuration = {
            ...configuration,
            endpointUrl: configuration.endpointUrl ?? EVALUATION_ENDPOINT_URL,
        };
    }

    public async evaluate(expression: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        const length = getLength(expression);

        if (length > Evaluator.MAX_EXPRESSION_LENGTH) {
            const response: ExpressionErrorResponse = {
                title: 'The expression is too complex.',
                status: 422, // Unprocessable Entity
                type: EvaluationErrorType.TOO_COMPLEX_EXPRESSION,
                detail: `The expression must be at most ${Evaluator.MAX_EXPRESSION_LENGTH} characters long, `
                    + `but it is ${length} characters long.`,
                errors: [{
                    cause: 'The expression is longer than expected.',
                    location: getLocation(expression, 0, Math.max(length - 1, 0)),
                }],
            };

            return Promise.reject(new ExpressionError(response));
        }

        const endpoint = new URL(this.configuration.endpointUrl);
        endpoint.searchParams.append('expression', expression);

        if (options.context !== undefined) {
            endpoint.searchParams.append('context', JSON.stringify(options.context));
        }

        const token = await this.configuration.tokenProvider.getToken();

        const headers = {
            'X-App-Id': this.configuration.appId,
            ...(token !== null && {'X-Token': token.toString()}),
        };

        return new Promise((resolve, reject) => {
            if (options.timeout !== undefined) {
                window.setTimeout(
                    () => {
                        const response: ErrorResponse = {
                            title: 'Maximum evaluation timeout reached before evaluation could complete.',
                            type: EvaluationErrorType.TIMEOUT,
                            detail: `The evaluation took more than ${options.timeout}ms to complete.`,
                            status: 408, // Request Timeout
                        };

                        reject(new EvaluationError(response));
                    },
                    options.timeout,
                );
            }

            const promise = window.fetch(endpoint.toString(), {
                method: 'GET',
                headers: headers,
                credentials: 'include',
            });

            promise.then(
                response => {
                    if (response.ok) {
                        response.json().then(resolve);

                        return;
                    }

                    response.json().then(result => {
                        const errorResponse: ErrorResponse = result;

                        switch (errorResponse.type) {
                            case EvaluationErrorType.INVALID_EXPRESSION:
                            case EvaluationErrorType.EVALUATION_FAILED:
                            case EvaluationErrorType.TOO_COMPLEX_EXPRESSION:
                                reject(new ExpressionError(errorResponse as ExpressionErrorResponse));
                                break;

                            default:
                                reject(new EvaluationError(errorResponse));
                                break;
                        }
                    });
                },
                error => {
                    const errorResponse: ErrorResponse = {
                        title: formatMessage(error),
                        type: EvaluationErrorType.UNEXPECTED_ERROR,
                        detail: 'Please try again or contact Croct support if the error persists.',
                        status: 500, // Internal Server Error
                    };

                    reject(new EvaluationError(errorResponse))
                },
            );
        });
    }
}
