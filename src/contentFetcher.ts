import {JsonObject} from '@croct/json';
import {EvaluationContext} from './evaluator';
import {TokenProvider} from './token';
import {CidAssigner} from './cid';
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

export type FetchOptions = {
    timeout?: number,
    version?: `${number}`|number,
    preferredLocale?: string,
    context?: EvaluationContext,
};

export type FetchResponse<P extends JsonObject> = {
    content: P,
};

export type Configuration = {
    appId: string,
    endpointUrl?: string,
    previewTokenProvider: TokenProvider,
    userTokenProvider: TokenProvider,
    cidAssigner: CidAssigner,
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
                window.setTimeout(
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

            this.load(slotId, options, abortController.signal)
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

    private async load(slotId: string, options: FetchOptions, signal: AbortSignal): Promise<Response> {
        const {userTokenProvider, previewTokenProvider, cidAssigner, endpointUrl} = this.configuration;
        const userToken = userTokenProvider.getToken();
        const previewToken = previewTokenProvider.getToken();
        const cid = await cidAssigner.assignCid();

        const headers = {
            'X-App-Id': this.configuration.appId,
            'X-Client-Id': cid,
            ...(userToken !== null && {'X-Token': userToken.toString()}),
        };

        const payload: FetchPayload = {
            slotId: slotId,
        };

        if (options.version !== undefined) {
            payload.version = `${options.version}`;
        }

        if (options.preferredLocale !== undefined) {
            payload.preferredLocale = options.preferredLocale;
        }

        if (options.context !== undefined) {
            payload.context = options.context;
        }

        if (previewToken !== null) {
            payload.previewToken = previewToken.toString();
        }

        return fetch(endpointUrl, {
            method: 'POST',
            headers: headers,
            signal: signal,
            credentials: 'include',
            body: JSON.stringify(payload),
        });
    }
}
