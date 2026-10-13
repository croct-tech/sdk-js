import type {Token} from './token';
import {BASE_ENDPOINT_URL, CLIENT_LIBRARY} from './constants';
import {formatMessage} from './error';
import type {ApiProblem} from './error';
import type {Logger} from './logging';
import {NullLogger} from './logging';
import {ApiKey} from './apiKey';
import {Help} from './help';
import type {BeaconPayload, TrackingEventContext} from './trackingEvents';

type AllowedFetchOptions = Exclude<keyof RequestInit, 'method' | 'body' | 'headers' | 'signal'>;

type ExtraFetchOptions<T extends keyof RequestInit = AllowedFetchOptions> = Pick<RequestInit, T>
    & {[key in Exclude<keyof RequestInit, T>]?: never}
    & Record<string, any>;

export type EventType = BeaconPayload['type'];

export type EventData<T extends EventType> = {
    // Distributes over the event types so that the type and payload of each event stay correlated
    [K in T]: {
        /**
         * The type of the event.
         */
        type: K,

        /**
         * The properties of the event, in the format expected by the tracking API.
         */
        payload: Omit<Extract<BeaconPayload, {type: K}>, 'type'>,
    }
}[T];

type EventMetadata = {
    /**
     * The ID of the client the event belongs to.
     */
    clientId: string,

    /**
     * The time the event occurred, in milliseconds since the epoch.
     */
    timestamp: number,

    /**
     * The context where the event occurred.
     */
    context: TrackingEventContext,
    clientIp?: string,
    clientAgent?: string,
    userToken?: Token | string,
};

export type PublishRequest<T extends EventType = EventType> = EventData<T> & EventMetadata;

export type PublishOptions = {
    timeout?: number,
    extra?: ExtraFetchOptions,
};

export enum PublishErrorType {
    TIMEOUT = 'https://croct.help/sdk/javascript/request-timeout',
    // Server errors
    INTERNAL_ERROR = 'https://croct.help/api/event-tracking/internal-error',
}

export class PublishError<T extends ApiProblem = ApiProblem> extends Error {
    public readonly response: T;

    public constructor(response: T) {
        super(response.title);

        this.response = response;

        Object.setPrototypeOf(this, PublishError.prototype);
    }
}

export type Configuration = {
    appId?: string,
    apiKey?: string | ApiKey,
    baseEndpointUrl?: string,
    logger?: Logger,
    defaultTimeout?: number,
};

type InternalConfiguration = {
    credentials: Record<string, string>,
    defaultTimeout?: number,
};

/**
 * Publishes events directly to the tracking API.
 *
 * Unlike the tracker, the publisher keeps no state and does not depend on
 * the browser, so it can track events on behalf of a user from anywhere,
 * such as from a server. Each call sends a single event and settles once
 * the API acknowledges it, without queueing or retrying.
 *
 * The publisher sends the event as given, without transforming it or
 * filling in any information, so the caller must provide the event
 * complete and in the format expected by the tracking API.
 */
export class EventPublisher {
    private readonly configuration: InternalConfiguration;

    private readonly endpoint: string;

    private readonly logger: Logger;

    public constructor(configuration: Configuration) {
        const {appId, apiKey, baseEndpointUrl = BASE_ENDPOINT_URL} = configuration;
        const baseEndpoint = baseEndpointUrl.replace(/\/+$/, '');

        if (appId !== undefined && apiKey === undefined) {
            this.endpoint = `${baseEndpoint}/client/web/track`;
            this.configuration = {
                credentials: {'X-App-Id': appId},
                defaultTimeout: configuration.defaultTimeout,
            };
        } else if (apiKey !== undefined && appId === undefined) {
            this.endpoint = `${baseEndpoint}/external/web/track`;
            this.configuration = {
                credentials: {'X-Api-Key': ApiKey.from(apiKey).getIdentifier()},
                defaultTimeout: configuration.defaultTimeout,
            };
        } else {
            throw new Error('Either the application ID or the API key must be provided.');
        }

        this.logger = configuration.logger ?? new NullLogger();
    }

    public publish<T extends EventType>(
        request: PublishRequest<T>,
        options: PublishOptions = {},
    ): Promise<void> {
        const {type, payload, timestamp, context} = request;
        const body = JSON.stringify({
            context: context,
            payload: {...payload, type: type},
            originalTime: timestamp,
            departureTime: Date.now(),
        });

        return new Promise((resolve, reject) => {
            const abortController = new AbortController();
            const timeout = options.timeout ?? this.configuration.defaultTimeout;

            let timer: number | undefined;

            if (timeout !== undefined) {
                timer = setTimeout(
                    () => {
                        const response: ApiProblem = {
                            title: `Event "${type}" could not be published in time.`,
                            type: PublishErrorType.TIMEOUT,
                            detail: `The request took more than ${timeout}ms to complete.`,
                            status: 408, // Request Timeout
                        };

                        abortController.abort();

                        this.logHelp(response);

                        reject(new PublishError(response));
                    },
                    timeout,
                );
            }

            this.fetch(body, abortController.signal, request, options)
                .finally(() => clearTimeout(timer))
                .then(
                    response => {
                        if (response.status === 202) {
                            // Tracking is suspended, but the event was accepted
                            this.logger.warn(Help.forStatusCode(202));

                            return resolve();
                        }

                        if (response.ok) {
                            this.logger.debug(`Successfully published event "${type}".`);

                            return resolve();
                        }

                        return response.json()
                            .catch(
                                (): ApiProblem => ({
                                    title: response.statusText,
                                    type: PublishErrorType.INTERNAL_ERROR,
                                    status: response.status,
                                }),
                            )
                            .then((problem: ApiProblem) => {
                                this.logHelp(problem);

                                reject(new PublishError(problem));
                            });
                    },
                )
                .catch(
                    error => {
                        if (!abortController.signal.aborted) {
                            reject(
                                new PublishError({
                                    title: formatMessage(error),
                                    type: PublishErrorType.INTERNAL_ERROR,
                                    detail: 'Please try again or contact Croct support if the error persists.',
                                    status: 500, // Internal Server Error
                                }),
                            );
                        }
                    },
                );
        });
    }

    private fetch(
        body: string,
        signal: AbortSignal,
        metadata: EventMetadata,
        options: PublishOptions,
    ): Promise<Response> {
        const {clientId, clientIp, userToken, clientAgent} = metadata;

        const headers: Record<string, string> = {
            ...this.configuration.credentials,
            'Content-Type': 'application/json',
            'X-Client-Id': clientId,
            'X-Client-Library': CLIENT_LIBRARY,
        };

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
            body: body,
        });
    }

    private logHelp(problem: ApiProblem): void {
        const help = Help.forApiProblem(problem);

        if (help !== undefined) {
            this.logger.error(help);
        }
    }

    public toJSON(): never {
        // Prevent sensitive configuration from being serialized
        throw new Error('Unserializable value.');
    }
}
