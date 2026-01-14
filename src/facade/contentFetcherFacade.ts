import {JsonObject} from '@croct/json';
import {formatCause} from '../error';
import {ContentFetcher, FetchResponse, FetchOptions as ResolvedFetchOptions} from '../contentFetcher';
import {ContextFactory} from './evaluatorFacade';
import {fetchOptionsSchema as optionsSchema} from '../schema';
import {TokenProvider} from '../token';
import {CidAssigner} from '../cid';

export type FetchOptions = {
    version?: `${number}`|number,
    preferredLocale?: string,
    timeout?: number,
    schema?: boolean,
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

    public async fetch<P extends JsonObject, O extends FetchOptions>(
        slotId: string,
        options?: O,
    ): Promise<FetchResponse<P, O>> {
        if (typeof slotId !== 'string' || slotId.length === 0) {
            throw new Error('The slot ID must be a non-empty string.');
        }

        const facadeOptions = {...options};

        validate(facadeOptions);

        const resolvedOptions: ResolvedFetchOptions & O = {
            static: false,
            clientId: await this.cidAssigner.assignCid(),
            userToken: this.userTokenProvider.getToken() ?? undefined,
            previewToken: this.previewTokenProvider.getToken() ?? undefined,
            version: facadeOptions.version,
            context: this.contextFactory.createContext(facadeOptions.attributes),
            timeout: facadeOptions.timeout,
            preferredLocale: facadeOptions.preferredLocale,
            schema: facadeOptions.schema,
        } satisfies ResolvedFetchOptions & O;

        return this.fetcher.fetch<P, O>(slotId, resolvedOptions);
    }
}
