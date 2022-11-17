import {JsonObject} from '@croct/json';
import {EvaluationContext} from './evaluator';
import {Token} from './token';
import {CONTENT_ENDPOINT_URL} from './constants';
import {formatMessage} from './error';

export type ErrorResponse = {
    type: string,
    title: string,
    status: number,
    detail?: string,
};

export enum ContentErrorType {
    TIMEOUT = 'https://croct.help/api/content#timeout',
    UNEXPECTED_ERROR = 'https://croct.help/api/content#unexpected-error',
}

type FetchPayload = {
    slotId: string,
    version?: string,
    preferredLocale?: string,
    previewToken?: string,
    context?: EvaluationContext,
};

export class ContentError<T extends ErrorResponse = ErrorResponse> extends Error {
    public readonly response: T;

    public constructor(response: T) {
        super(response.title);

        this.response = response;

        Object.setPrototypeOf(this, ContentError.prototype);
    }
}

type BasicOptions = {
    version?: `${number}` | number,
    preferredLocale?: string,
    timeout?: number,
    extra?: ExtraFetchOptions,
};

export type StaticContentOptions = BasicOptions & {
    static: true,
};

export type DynamicContentOptions = BasicOptions & {
    static?: false,
    clientId?: string,
    clientIp?: string,
    userAgent?: string,
    userToken?: Token|string,
    previewToken?: Token|string,
    context?: EvaluationContext,
};

type AllowedFetchOptions = Exclude<keyof RequestInit, 'method' | 'body' | 'headers' | 'signal'>;

type ExtraFetchOptions<T extends keyof RequestInit = AllowedFetchOptions> = Pick<RequestInit, T>
    & {[key in Exclude<keyof RequestInit, T>]?: never}
    & Record<string, any>;

export type FetchOptions = StaticContentOptions | DynamicContentOptions;

export type FetchResponse<P extends JsonObject = JsonObject> = {
    content: P,
};

export type Configuration = {
    appId?: string,
    apiKey?: string,
    endpointUrl?: string,
};

export class ContentFetcher {
    private readonly configuration: Configuration;

    private readonly dynamicEndpoint: string;

    private readonly staticEndpoint: string;

    public constructor(configuration: Configuration) {
        if ((configuration.appId === undefined) === (configuration.apiKey === undefined)) {
            throw new Error('Either the application ID or the API key must be provided.');
        }

        this.configuration = configuration;

        const {apiKey, endpointUrl} = this.configuration;

        // eslint-disable-next-line prefer-template -- Better readability
        const baseEndpoint = (endpointUrl ?? CONTENT_ENDPOINT_URL).replace(/\/+$/, '')
            + (apiKey === undefined ? '/client' : '/external')
            + '/web';

        this.dynamicEndpoint = `${baseEndpoint}/content`;
        this.staticEndpoint = `${baseEndpoint}/static-content`;
    }

    public fetch<P extends JsonObject>(slotId: string, options: FetchOptions = {}): Promise<FetchResponse<P>> {
        if (options.static === true && this.configuration.apiKey === undefined) {
            throw new Error('The API key must be provided to fetch static content.');
        }

        return new Promise((resolve, reject) => {
            const abortController = new AbortController();

            if (options.timeout !== undefined) {
                setTimeout(
                    () => {
                        const response: ErrorResponse = {
                            title: 'Maximum timeout reached before content could be loaded.',
                            type: ContentErrorType.TIMEOUT,
                            detail: `The content took more than ${options.timeout}ms to load.`,
                            status: 408, // Request Timeout
                        };

                        abortController.abort();

                        reject(new ContentError(response));
                    },
                    options.timeout,
                );
            }

            this.load(slotId, abortController.signal, options)
                .then(
                    response => response.json()
                        .then(body => {
                            if (response.ok) {
                                resolve(body);
                            } else {
                                reject(new ContentError(body));
                            }
                        }),
                )
                .catch(error => {
                    if (!abortController.signal.aborted) {
                        reject(
                            new ContentError({
                                title: formatMessage(error),
                                type: ContentErrorType.UNEXPECTED_ERROR,
                                detail: 'Please try again or contact Croct support if the error persists.',
                                status: 500, // Internal Server Error
                            }),
                        );
                    }
                });
        });
    }

    private load(slotId: string, signal: AbortSignal, options: FetchOptions): Promise<Response> {
        const payload: FetchPayload = {
            slotId: slotId,
        };

        const {apiKey, appId} = this.configuration;

        const headers = new Headers();

        if (appId !== undefined) {
            headers.set('X-App-Id', appId);
        }

        if (apiKey !== undefined) {
            headers.set('X-Api-Key', apiKey);
        }

        const dynamic = ContentFetcher.isDynamicContent(options);

        if (dynamic) {
            if (options.clientId !== undefined) {
                headers.set('X-Client-Id', options.clientId);
            }

            if (options.clientIp !== undefined) {
                headers.set('X-Client-Ip', options.clientIp);
            }

            if (options.userToken !== undefined) {
                headers.set('X-Token', options.userToken.toString());
            }

            if (options.userAgent !== undefined) {
                headers.set('User-Agent', options.userAgent);
            }

            if (options.version !== undefined) {
                payload.version = `${options.version}`;
            }

            if (options.preferredLocale !== undefined) {
                payload.preferredLocale = options.preferredLocale;
            }

            if (options.context !== undefined) {
                payload.context = options.context;
            }

            if (options.previewToken !== undefined) {
                payload.previewToken = `${options.previewToken}`;
            }
        }

        return fetch(dynamic ? this.dynamicEndpoint : this.staticEndpoint, {
            credentials: 'omit',
            ...options.extra,
            method: 'POST',
            headers: headers,
            signal: signal,
            body: JSON.stringify(payload),
        });
    }

    private static isDynamicContent(options: FetchOptions): options is DynamicContentOptions {
        return options.static !== true;
    }

    public toJSON(): never {
        // Prevent sensitive configuration from being serialized
        throw new Error('Unserializable value.');
    }
}
