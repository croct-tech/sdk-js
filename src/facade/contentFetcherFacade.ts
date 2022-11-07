import {JsonObject} from '@croct/json';
import {formatCause} from '../error';
import {ContentFetcher, FetchResponse, FetchOptions as BaseOptions} from '../contentFetcher';
import {ContextFactory} from './evaluatorFacade';
import {fetchOptionsSchema as optionsSchema} from '../schema';

export type FetchOptions = Omit<BaseOptions, 'context'> & {
    attributes?: JsonObject,
};

function validate(options: unknown): asserts options is FetchOptions {
    try {
        optionsSchema.validate(options);
    } catch (violation) {
        throw new Error(`Invalid options: ${formatCause(violation)}`);
    }
}

export class ContentFetcherFacade {
    private readonly fetcher: ContentFetcher;

    private readonly contextFactory: ContextFactory;

    public constructor(fetcher: ContentFetcher, contextFactory: ContextFactory) {
        this.fetcher = fetcher;
        this.contextFactory = contextFactory;
    }

    public fetch<P extends JsonObject>(slotId: string, options: FetchOptions = {}): Promise<FetchResponse<P>> {
        if (typeof slotId !== 'string' || slotId.length === 0) {
            throw new Error('The slot ID must be a non-empty string.');
        }

        validate(options);

        return this.fetcher.fetch(slotId, {
            timeout: options.timeout,
            version: options.version,
            preferredLocale: options.preferredLocale,
            context: this.contextFactory.createContext(options.attributes),
        });
    }
}
