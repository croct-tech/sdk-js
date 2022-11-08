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
    apiKey: string,
};

type DynamicContentOptions = {
    static?: false,
    apiKey?: string,
    clientId?: string,
    userToken?: Token|string,
    previewToken?: Token|string,
    context?: EvaluationContext,
};

export type FetchOptions = (StaticContentOptions | DynamicContentOptions) & {
    appId?: string,
    version?: `${number}`|number,
    preferredLocale?: string,
    timeout?: number,
};

export type FetchResponse<P extends JsonObject = JsonObject> = {
    content: P,
};

export type Configuration = {
    appId: string,
    endpointUrl?: string,
};

export class ContentFetcher {
    private readonly configuration: Required<Configuration>;

    public constructor(configuration: Configuration) {
        this.configuration = {
            ...configuration,
            endpointUrl: configuration.endpointUrl ?? CONTENT_ENDPOINT_URL,
        };
    }

    public async fetch<P extends JsonObject>(slotId: string, options: FetchOptions = {}): Promise<FetchResponse<P>> {
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

        const headers: Record<string, string> = options.apiKey === undefined
            ? {'X-App-Id': this.configuration.appId}
            : {'X-Api-Key': options.apiKey};

        // eslint-disable-next-line prefer-template -- Better readability
        const endpoint = this.configuration.endpointUrl.replace(/\/+$/, '')
            + (options.apiKey !== undefined ? '/external' : '/client')
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
            method: 'POST',
            headers: headers,
            signal: signal,
            credentials: 'include',
            cache: 'no-cache',
            body: JSON.stringify(payload),
        });
    }

    private static isDynamicContent(options: FetchOptions): options is DynamicContentOptions {
        return options.static !== true;
    }
}
