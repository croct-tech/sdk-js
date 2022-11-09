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

type StaticContentOptions = {
    static: true,
};

type DynamicContentOptions = {
    static?: false,
    clientId?: string,
    userToken?: Token|string,
    previewToken?: Token|string,
    context?: EvaluationContext,
};

type AllowedFetchOptions = Exclude<keyof RequestInit, 'method' | 'body' | 'headers' | 'signal'>;

type ExtraFetchOptions<T extends keyof RequestInit = AllowedFetchOptions> = Pick<RequestInit, T>
    & {[key in Exclude<keyof RequestInit, T>]?: never}
    & Record<string, any>;

export type FetchOptions = (StaticContentOptions | DynamicContentOptions) & {
    version?: `${number}`|number,
    preferredLocale?: string,
    timeout?: number,
    extra?: ExtraFetchOptions,
};

export type FetchResponse<P extends JsonObject = JsonObject> = {
    content: P,
};

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

export class ContentFetcher {
    private readonly configuration: NormalizedConfiguration;

    public constructor(configuration: Configuration) {
        if ((configuration.appId === undefined) === (configuration.apiKey === undefined)) {
            throw new Error('Either the application ID or the API key must be provided.');
        }

        this.configuration = {
            ...configuration,
            endpointUrl: configuration.endpointUrl ?? CONTENT_ENDPOINT_URL,
        };
    }

    public fetch<P extends JsonObject>(slotId: string, options: FetchOptions = {}): Promise<FetchResponse<P>> {
        if (options.static && this.configuration.apiKey === undefined) {
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
                .then(response => {
                    if (response.ok) {
                        response.json().then(resolve);

                        return;
                    }

                    response.json().then(result => {
                        reject(new ContentError(result));
                    });
                })
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

    private async load(slotId: string, signal: AbortSignal, options: FetchOptions): Promise<Response> {
        const dynamic = ContentFetcher.isDynamicContent(options);
        const {apiKey, appId} = this.configuration;

        const headers: Record<string, string> = {
            ...(appId && {'X-App-Id': appId}),
            ...(apiKey && {'X-Api-Key': apiKey}),
        };

        // eslint-disable-next-line prefer-template -- Better readability
        const endpoint = this.configuration.endpointUrl.replace(/\/+$/, '')
            + (apiKey !== undefined ? '/external' : '/client')
            + '/web'
            + (dynamic ? '/content' : '/static-content');

        const payload: FetchPayload = {
            slotId: slotId,
        };

        if (dynamic) {
            if (options.clientId !== undefined) {
                headers['X-Client-Id'] = options.clientId;
            }

            if (options.userToken !== undefined) {
                headers['X-Token'] = `${options.userToken}`;
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

        return fetch(endpoint, {
            credentials: 'include',
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
