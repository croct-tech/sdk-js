import {JsonObject} from '@croct/json';
import type {ContentDefinitionBundle} from '@croct/content-model/definition';
import {EvaluationContext} from './evaluator';
import {Token} from './token';
import {BASE_ENDPOINT_URL, CLIENT_LIBRARY} from './constants';
import {formatMessage} from './error';
import {Logger, NullLogger} from './logging';
import {ApiKey} from './apiKey';
import {Help} from './help';

export type ErrorResponse = {
    type: string,
    title: string,
    status: number,
    detail?: string,
};

export enum ContentErrorType {
    TIMEOUT = 'https://croct.help/sdk/javascript/request-timeout',
    UNEXPECTED_ERROR = 'https://croct.help/sdk/javascript/unexpected-error',
    SUSPENDED_SERVICE = 'https://croct.help/sdk/javascript/suspended-service',
}

type FetchPayload = {
    slotId: string,
    version?: string,
    schema?: boolean,
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

export type FetchResponseOptions = {
    schema?: boolean,
};

type BasicOptions = FetchResponseOptions & {
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
    clientAgent?: string,
    userToken?: Token|string,
    previewToken?: Token|string,
    context?: EvaluationContext,
};

type AllowedFetchOptions = Exclude<keyof RequestInit, 'method' | 'body' | 'headers' | 'signal'>;

type ExtraFetchOptions<T extends keyof RequestInit = AllowedFetchOptions> = Pick<RequestInit, T>
    & {[key in Exclude<keyof RequestInit, T>]?: never}
    & Record<string, any>;

export type FetchOptions = StaticContentOptions | DynamicContentOptions;

type With<T, K extends keyof T> = T & {[P in K]-?: T[P]};

export type SlotMetadata = {
    version: string,
    schema?: ContentDefinitionBundle,
    experience?: {
        experienceId: string,
        audienceId: string,
        experiment?: {
            experimentId: string,
            variantId: string,
        },
    },
};

export type FetchResponse<P extends JsonObject = JsonObject, M extends FetchResponseOptions = FetchResponseOptions> = {
    metadata: With<SlotMetadata, M extends {schema: true} ? 'schema' : never>,
    content: P,
};

export type Configuration = {
    appId?: string,
    apiKey?: string|ApiKey,
    baseEndpointUrl?: string,
    logger?: Logger,
    defaultTimeout?: number,
    defaultPreferredLocale?: string,
};

type InternalConfiguration = {
    appId?: string,
    apiKey?: string,
    defaultTimeout?: number,
    defaultPreferredLocale?: string,
};

export class ContentFetcher {
    private readonly configuration: InternalConfiguration;

    private readonly dynamicEndpoint: string;

    private readonly staticEndpoint: string;

    private readonly logger: Logger;

    public constructor(configuration: Configuration) {
        if ((configuration.appId === undefined) === (configuration.apiKey === undefined)) {
            throw new Error('Either the application ID or the API key must be provided.');
        }

        const {baseEndpointUrl} = configuration;

        // eslint-disable-next-line prefer-template -- Better readability
        const baseEndpoint = (baseEndpointUrl ?? BASE_ENDPOINT_URL).replace(/\/+$/, '')
            + (configuration.apiKey === undefined ? '/client' : '/external')
            + '/web';

        this.dynamicEndpoint = `${baseEndpoint}/content`;
        this.staticEndpoint = `${baseEndpoint}/static-content`;
        this.logger = configuration.logger ?? new NullLogger();
        this.configuration = {
            appId: configuration.appId,
            apiKey: configuration.apiKey !== undefined
                ? ApiKey.from(configuration.apiKey).getIdentifier()
                : configuration.apiKey,
            defaultTimeout: configuration.defaultTimeout,
            defaultPreferredLocale: configuration.defaultPreferredLocale,
        };
    }

    public fetch<P extends JsonObject, O extends FetchOptions>(
        slotId: string,
        options?: O,
    ): Promise<FetchResponse<P, O>> {
        if (options?.static === true && this.configuration.apiKey === undefined) {
            throw new Error('The API key must be provided to fetch static content.');
        }

        return new Promise<FetchResponse<P, O>>((resolve, reject) => {
            const abortController = new AbortController();
            const timeout = options?.timeout ?? this.configuration.defaultTimeout;

            let timer: number | NodeJS.Timeout | undefined;

            if (timeout !== undefined) {
                timer = setTimeout(
                    () => {
                        const response: ErrorResponse = {
                            title: `Content could not be loaded in time for slot '${slotId}'.`,
                            type: ContentErrorType.TIMEOUT,
                            detail: `The content took more than ${timeout}ms to load.`,
                            status: 408, // Request Timeout
                        };

                        abortController.abort();

                        this.logHelp(response.status);

                        reject(new ContentError(response));
                    },
                    timeout,
                );
            }

            this.load(slotId, abortController.signal, options ?? {})
                .finally(() => clearTimeout(timer))
                .then(response => {
                    const region = response.headers.get('X-Croct-Region');
                    const timing = response.headers.get('X-Croct-Timing');

                    this.logger.debug(`Content for slot '${slotId}' processed by region ${region} in ${timing}.`);

                    if (response.status === 202) {
                        return reject(new ContentError({
                            status: 202,
                            title: 'Service is suspended.',
                            type: ContentErrorType.SUSPENDED_SERVICE,
                            detail: Help.forStatusCode(202),
                        }));
                    }

                    return response.json()
                        .then(body => {
                            if (response.ok) {
                                return resolve(body);
                            }

                            this.logHelp(response.status);

                            reject(new ContentError(body));
                        })
                        .catch(error => {
                            if (!response.ok) {
                                throw new Error(`Error ${response.status} - ${response.statusText}`);
                            }

                            throw error;
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

    private load(slotId: string, signal: AbortSignal, options: FetchOptions): Promise<Response> {
        const {apiKey, appId} = this.configuration;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        headers['X-Client-Library'] = CLIENT_LIBRARY;

        if (appId !== undefined) {
            headers['X-App-Id'] = appId;
        }

        if (apiKey !== undefined) {
            headers['X-Api-Key'] = apiKey;
        }

        const payload: FetchPayload = {
            slotId: slotId,
        };

        if (options.schema === true) {
            payload.schema = true;
        }

        if (options.version !== undefined) {
            payload.version = `${options.version}`;
        }

        const preferredLocale = options.preferredLocale ?? this.configuration.defaultPreferredLocale;

        if (preferredLocale !== undefined) {
            payload.preferredLocale = preferredLocale;
        }

        const dynamic = ContentFetcher.isDynamicContent(options);

        if (dynamic) {
            if (options.clientId !== undefined) {
                headers['X-Client-Id'] = options.clientId;
            }

            if (options.clientIp !== undefined) {
                headers['X-Client-Ip'] = options.clientIp;
            }

            if (options.userToken !== undefined) {
                headers['X-Token'] = options.userToken.toString();
            }

            if (options.clientAgent !== undefined) {
                headers['X-Client-Agent'] = options.clientAgent;
            }

            if (options.context !== undefined) {
                payload.context = options.context;
            }

            if (options.previewToken !== undefined) {
                payload.previewToken = `${options.previewToken}`;
            }
        }

        return fetch(dynamic ? this.dynamicEndpoint : this.staticEndpoint, {
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
            body: JSON.stringify(payload),
        });
    }

    private logHelp(statusCode: number): void {
        const help = Help.forStatusCode(statusCode);

        if (help !== undefined) {
            this.logger.error(help);
        }
    }

    private static isDynamicContent(options: FetchOptions): options is DynamicContentOptions {
        return options.static !== true;
    }

    public toJSON(): never {
        // Prevent sensitive configuration from being serialized
        throw new Error('Unserializable value.');
    }
}
