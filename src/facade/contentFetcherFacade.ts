import {JsonObject} from '@croct/json';
import {formatCause} from '../error';
import {
    ContentFetcher,
    FetchResponse,
    FetchOptions as ResolvedFetchOptions,
    FetchResponseOptions,
} from '../contentFetcher';
import {ContextFactory} from './evaluatorFacade';
import {fetchOptionsSchema as optionsSchema} from '../schema';
import {TokenProvider} from '../token';
import {CidAssigner} from '../cid';

export type FetchOptions = FetchResponseOptions & {
    version?: `${number}`|number,
    preferredLocale?: string,
    timeout?: number,
    attributes?: JsonObject,
};

function validate(options: unknown): asserts options is FetchOptions {
    try {
        optionsSchema.validate(options);
    } catch (violation) {
        throw new Error(`Invalid options: ${formatCause(violation)}`);
    }
}

export type Configuration = {
    contentFetcher: ContentFetcher,
    contextFactory: ContextFactory,
    previewTokenProvider: TokenProvider,
    userTokenProvider: TokenProvider,
    cidAssigner: CidAssigner,
};

export class ContentFetcherFacade {
    private readonly fetcher: ContentFetcher;

    private readonly contextFactory: ContextFactory;

    private readonly previewTokenProvider: TokenProvider;

    private readonly userTokenProvider: TokenProvider;

    private readonly cidAssigner: CidAssigner;

    public constructor(configuration: Configuration) {
        this.fetcher = configuration.contentFetcher;
        this.previewTokenProvider = configuration.previewTokenProvider;
        this.userTokenProvider = configuration.userTokenProvider;
        this.cidAssigner = configuration.cidAssigner;
        this.contextFactory = configuration.contextFactory;
    }

    public async fetch<P extends JsonObject, O extends FetchResponseOptions>(
        slotId: string,
        options?: O & FetchOptions,
    ): Promise<FetchResponse<P, O>> {
        if (typeof slotId !== 'string' || slotId.length === 0) {
            throw new Error('The slot ID must be a non-empty string.');
        }

        if (options !== undefined) {
            validate(options);
        }

        return this.fetcher.fetch<P, ResolvedFetchOptions & O>(slotId, {
            static: false,
            clientId: await this.cidAssigner.assignCid(),
            userToken: this.userTokenProvider.getToken() ?? undefined,
            previewToken: this.previewTokenProvider.getToken() ?? undefined,
            version: options?.version,
            context: this.contextFactory.createContext(options?.attributes),
            timeout: options?.timeout,
            preferredLocale: options?.preferredLocale,
            includeSchema: options?.includeSchema,
        });
    }
}
