import {JsonObject, JsonValue} from '@croct/json';
import {Token} from './token';
import {BASE_ENDPOINT_URL, CLIENT_LIBRARY, MAX_QUERY_LENGTH} from './constants';
import {formatMessage} from './error';
import {getLength, getLocation, Location} from './sourceLocation';
import {Logger, NullLogger} from './logging';
import {ApiKey} from './apiKey';
import {Help} from './help';

export type Campaign = {
    name?: string,
    source?: string,
    medium?: string,
    term?: string,
    content?: string,
};

export type Page = {
    url: string,
    title?: string,
    referrer?: string,
};

export type EvaluationContext = {
    timeZone?: string,
    campaign?: Campaign,
    page?: Page,
    attributes?: JsonObject,
};

type AllowedFetchOptions = Exclude<keyof RequestInit, 'method' | 'body' | 'headers' | 'signal'>;

type ExtraFetchOptions<T extends keyof RequestInit = AllowedFetchOptions> = Pick<RequestInit, T>
    & {[key in Exclude<keyof RequestInit, T>]?: never}
    & Record<string, any>;

export type EvaluationOptions = {
    clientId?: string,
    clientIp?: string,
    clientAgent?: string,
    userToken?: Token|string,
    timeout?: number,
    context?: EvaluationContext,
    extra?: ExtraFetchOptions,
};

export enum EvaluationErrorType {
    TIMEOUT = 'https://croct.help/sdk/javascript/request-timeout',
    UNEXPECTED_ERROR = 'https://croct.help/sdk/javascript/unexpected-error',
    INVALID_QUERY = 'https://croct.help/sdk/javascript/invalid-query',
    TOO_COMPLEX_QUERY = 'https://croct.help/sdk/javascript/too-complex-query',
    EVALUATION_FAILED = 'https://croct.help/sdk/javascript/evaluation-failed',
    UNALLOWED_RESULT = 'https://croct.help/sdk/javascript/unallowed-result',
    SUSPENDED_SERVICE = 'https://croct.help/sdk/javascript/suspended-service',
    UNSERIALIZABLE_RESULT = 'https://croct.help/sdk/javascript/unserializable-result',
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
    apiKey?: string|ApiKey,
    baseEndpointUrl?: string,
    logger?: Logger,
    defaultTimeout?: number,
};

type InternalConfiguration = {
    appId?: string,
    apiKey?: string,
    defaultTimeout?: number,
};

export class Evaluator {
    public static readonly MAX_QUERY_LENGTH = MAX_QUERY_LENGTH;

    private readonly configuration: InternalConfiguration;

    private readonly endpoint: string;

    private readonly logger: Logger;

    public constructor(configuration: Configuration) {
        if ((configuration.appId === undefined) === (configuration.apiKey === undefined)) {
            throw new Error('Either the application ID or the API key must be provided.');
        }

        const {baseEndpointUrl} = configuration;

        // eslint-disable-next-line prefer-template -- Better readability
        this.endpoint = (baseEndpointUrl ?? BASE_ENDPOINT_URL).replace(/\/+$/, '')
            + (configuration.apiKey === undefined ? '/client' : '/external')
            + '/web/evaluate';
        this.logger = configuration.logger ?? new NullLogger();
        this.configuration = {
            appId: configuration.appId,
            apiKey: configuration.apiKey !== undefined
                ? ApiKey.from(configuration.apiKey).getIdentifier()
                : configuration.apiKey,
            defaultTimeout: configuration.defaultTimeout,
        };
    }

    public evaluate(query: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        const length = getLength(query);
        const reference = query.length > 20 ? `${query.slice(0, 20)}...` : query;

        if (length > Evaluator.MAX_QUERY_LENGTH) {
            const response: QueryErrorResponse = {
                title: 'The query is too complex.',
                status: 422, // Unprocessable Entity
                type: EvaluationErrorType.TOO_COMPLEX_QUERY,
                detail: `The query "${reference}" must be at most ${Evaluator.MAX_QUERY_LENGTH} characters long, `
                    + `but it is ${length} characters long.`,
                errors: [{
                    cause: 'The query is longer than expected.',
                    location: getLocation(query, 0, Math.max(length - 1, 0)),
                }],
            };

            return Promise.reject(new QueryError(response));
        }

        const payload: JsonObject = {
            query: query,
        };

        if (options.context !== undefined) {
            payload.context = options.context;
        }

        return new Promise((resolve, reject) => {
            const abortController = new AbortController();
            const timeout = options.timeout ?? this.configuration.defaultTimeout;

            let timer: number | NodeJS.Timeout | undefined;

            if (timeout !== undefined) {
                timer = setTimeout(
                    () => {
                        const response: ErrorResponse = {
                            title: `Evaluation could not be completed in time for query "${reference}".`,
                            type: EvaluationErrorType.TIMEOUT,
                            detail: `The evaluation took more than ${timeout}ms to complete.`,
                            status: 408, // Request Timeout
                        };

                        abortController.abort();

                        this.logHelp(response.status);

                        reject(new EvaluationError(response));
                    },
                    timeout,
                );
            }

            this.fetch(payload, abortController.signal, options)
                .finally(() => clearTimeout(timer))
                .then(
                    response => {
                        const region = response.headers.get('X-Croct-Region');
                        const timing = response.headers.get('X-Croct-Timing');

                        this.logger.debug(
                            `Evaluation of the query "${reference}" processed by region ${region} in ${timing}.`,
                        );

                        if (response.status === 202) {
                            return reject(new EvaluationError({
                                status: 204,
                                type: EvaluationErrorType.SUSPENDED_SERVICE,
                                title: 'Service is suspended.',
                                detail: Help.forStatusCode(204),
                            }));
                        }

                        return response.json()
                            .then(body => {
                                if (response.ok) {
                                    return resolve(body);
                                }

                                this.logHelp(response.status);

                                const problem: ErrorResponse = body;

                                switch (problem.type) {
                                    case EvaluationErrorType.INVALID_QUERY:
                                    case EvaluationErrorType.EVALUATION_FAILED:
                                    case EvaluationErrorType.TOO_COMPLEX_QUERY:
                                        reject(new QueryError(problem as QueryErrorResponse));

                                        break;

                                    default:
                                        reject(new EvaluationError(problem));

                                        break;
                                }
                            })
                            .catch(error => {
                                if (!response.ok) {
                                    throw new Error(`Error ${response.status} - ${response.statusText}`);
                                }

                                throw error;
                            });
                    },
                )
                .catch(
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

    private fetch(body: JsonObject, signal: AbortSignal, options: EvaluationOptions): Promise<Response> {
        const {appId, apiKey} = this.configuration;
        const {clientId, clientIp, userToken, clientAgent} = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        headers['X-Client-Library'] = CLIENT_LIBRARY;

        if (apiKey !== undefined) {
            headers['X-Api-Key'] = apiKey;
        } else if (appId !== undefined) {
            headers['X-App-Id'] = appId;
        }

        if (clientId !== undefined) {
            headers['X-Client-Id'] = clientId;
        }

        if (clientIp !== undefined) {
            headers['X-Client-Ip'] = clientIp;
        }

        if (userToken !== undefined) {
            headers['X-Token'] = userToken.toString();
        }

        if (clientAgent !== undefined) {
            headers['X-Client-Agent'] = clientAgent;
        }

        return fetch(this.endpoint, {
            // Set the request mode to 'cors' when running in the browser.
            // By default, the request mode is computed based on the referrer policy
            // and response-tainting rules applied to the script that ultimately
            // initiated the fetch, make this prone to errors due to unrelated
            // configurations on the page.
            // https://fetch.spec.whatwg.org/#origin-header
            mode: typeof window === 'undefined' ? undefined : 'cors',
            credentials: 'omit',
            ...options.extra,
            method: 'POST',
            headers: headers,
            signal: signal,
            body: JSON.stringify(body),
        });
    }

    private logHelp(statusCode: number): void {
        const help = Help.forStatusCode(statusCode);

        if (help !== undefined) {
            this.logger.error(help);
        }
    }

    public toJSON(): never {
        // Prevent sensitive configuration from being serialized
        throw new Error('Unserializable value.');
    }
}
