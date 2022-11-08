import {JsonObject, JsonValue} from '@croct/json';
import {Token} from './token';
import {EVALUATION_ENDPOINT_URL, MAX_QUERY_LENGTH} from './constants';
import {formatMessage} from './error';
import {getLength, getLocation, Location} from './sourceLocation';

export type Campaign = {
    name?: string,
    source?: string,
    medium?: string,
    term?: string,
    content?: string,
};

export type Page = {
    title: string,
    url: string,
    referrer?: string,
};

export type EvaluationContext = {
    timeZone?: string,
    campaign?: Campaign,
    page?: Page,
    attributes?: JsonObject,
};

export type EvaluationOptions = {
    clientId?: string,
    userToken?: Token|string,
    timeout?: number,
    context?: EvaluationContext,
};

export enum EvaluationErrorType {
    TIMEOUT = 'https://croct.help/api/evaluation#timeout',
    UNEXPECTED_ERROR = 'https://croct.help/api/evaluation#unexpected-error',
    INVALID_QUERY = 'https://croct.help/api/evaluation#invalid-query',
    TOO_COMPLEX_QUERY = 'https://croct.help/api/evaluation#too-complex-query',
    EVALUATION_FAILED = 'https://croct.help/api/evaluation#evaluation-failed',
    UNALLOWED_RESULT = 'https://croct.help/api/evaluation#unallowed-result',
    UNSERIALIZABLE_RESULT = 'https://croct.help/api/evaluation#unserializable-result',
}

export type ErrorResponse = {
    type: EvaluationErrorType,
    title: string,
    status: number,
    detail?: string,
};

export class EvaluationError<T extends ErrorResponse = ErrorResponse> extends Error {
    public readonly response: T;

    public constructor(response: T) {
        super(response.title);

        this.response = response;

        Object.setPrototypeOf(this, EvaluationError.prototype);
    }
}

type QueryErrorDetail = {
    cause: string,
    location: Location,
};

export type QueryErrorResponse = ErrorResponse & {
    errors: QueryErrorDetail[],
};

export class QueryError extends EvaluationError<QueryErrorResponse> {
    public constructor(response: QueryErrorResponse) {
        super(response);

        Object.setPrototypeOf(this, QueryError.prototype);
    }
}

export type Configuration = {
    appId?: string,
    apiKey?: string,
    endpointUrl?: string,
};

type NormalizedConfiguration = {
    appId?: string,
    apiKey?: string,
    endpointUrl: string,
};

export class Evaluator {
    public static readonly MAX_QUERY_LENGTH = MAX_QUERY_LENGTH;

    private readonly configuration: NormalizedConfiguration;

    public constructor(configuration: Configuration) {
        if ((configuration.appId === undefined) === (configuration.apiKey === undefined)) {
            throw new Error('Either the application ID or the API key must be provided.');
        }

        this.configuration = {
            ...configuration,
            endpointUrl: configuration.endpointUrl ?? EVALUATION_ENDPOINT_URL,
        };
    }

    public async evaluate(query: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        const length = getLength(query);

        if (length > Evaluator.MAX_QUERY_LENGTH) {
            const response: QueryErrorResponse = {
                title: 'The query is too complex.',
                status: 422, // Unprocessable Entity
                type: EvaluationErrorType.TOO_COMPLEX_QUERY,
                detail: `The query must be at most ${Evaluator.MAX_QUERY_LENGTH} characters long, `
                    + `but it is ${length} characters long.`,
                errors: [{
                    cause: 'The query is longer than expected.',
                    location: getLocation(query, 0, Math.max(length - 1, 0)),
                }],
            };

            return Promise.reject(new QueryError(response));
        }

        const body: JsonObject = {
            query: query,
        };

        if (options.context !== undefined) {
            body.context = options.context;
        }

        return new Promise((resolve, reject) => {
            const abortController = new AbortController();

            if (options.timeout !== undefined) {
                setTimeout(
                    () => {
                        const response: ErrorResponse = {
                            title: 'Maximum evaluation timeout reached before evaluation could complete.',
                            type: EvaluationErrorType.TIMEOUT,
                            detail: `The evaluation took more than ${options.timeout}ms to complete.`,
                            status: 408, // Request Timeout
                        };

                        abortController.abort();

                        reject(new EvaluationError(response));
                    },
                    options.timeout,
                );
            }

            const promise = this.fetch(body, abortController.signal, options);

            promise.then(
                response => {
                    if (response.ok) {
                        response.json().then(resolve);

                        return;
                    }

                    response.json().then(result => {
                        const errorResponse: ErrorResponse = result;

                        switch (errorResponse.type) {
                            case EvaluationErrorType.INVALID_QUERY:
                            case EvaluationErrorType.EVALUATION_FAILED:
                            case EvaluationErrorType.TOO_COMPLEX_QUERY:
                                reject(new QueryError(errorResponse as QueryErrorResponse));
                                break;

                            default:
                                reject(new EvaluationError(errorResponse));
                                break;
                        }
                    });
                },
                error => {
                    if (!abortController.signal.aborted) {
                        reject(
                            new EvaluationError({
                                title: formatMessage(error),
                                type: EvaluationErrorType.UNEXPECTED_ERROR,
                                detail: 'Please try again or contact Croct support if the error persists.',
                                status: 500, // Internal Server Error
                            }),
                        );
                    }
                },
            );
        });
    }

    private async fetch(body: JsonObject, signal: AbortSignal, options: EvaluationOptions): Promise<Response> {
        const {appId, apiKey} = this.configuration;
        const {clientId, userToken} = options;

        const headers = {
            ...(apiKey === undefined && {'X-App-Id': appId}),
            ...(apiKey !== undefined && {'X-Api-Key': apiKey}),
            ...(clientId !== undefined && {'X-Client-Id': clientId}),
            ...(userToken !== undefined && {'X-Token': `${userToken}`}),
        };

        // eslint-disable-next-line prefer-template -- Better readability
        const endpoint = this.configuration.endpointUrl.replace(/\/+$/, '')
            + (apiKey !== undefined ? '/external' : '/client')
            + '/web/evaluate';

        return fetch(endpoint, {
            method: 'POST',
            headers: headers,
            signal: signal,
            credentials: 'include',
            cache: 'no-cache',
            body: JSON.stringify(body),
        });
    }

    public toJSON(): never {
        // Prevent sensitive configuration from being serialized
        throw new Error('Unserializable value.');
    }
}
