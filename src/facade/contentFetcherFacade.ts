import {JsonObject} from '@croct/json';
import {formatCause} from '../error';
import {ContentFetcher, FetchResponse} from '../contentFetcher';
import {ContextFactory} from './evaluatorFacade';
import {fetchOptionsSchema as optionsSchema} from '../schema';
import {TokenProvider} from '../token';
import {CidAssigner} from '../cid';

export type FetchOptions = {
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

type Options = {
    preferredLocale?: string,
};

export type Configuration = Options & {
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

    private readonly options: Options;

    public constructor(configuration: Configuration) {
        this.fetcher = configuration.contentFetcher;
        this.previewTokenProvider = configuration.previewTokenProvider;
        this.userTokenProvider = configuration.userTokenProvider;
        this.cidAssigner = configuration.cidAssigner;
        this.contextFactory = configuration.contextFactory;

        this.options = {
            preferredLocale: configuration.preferredLocale,
        };
    }

    public async fetch<P extends JsonObject>(slotId: string, options: FetchOptions = {}): Promise<FetchResponse<P>> {
        if (typeof slotId !== 'string' || slotId.length === 0) {
            throw new Error('The slot ID must be a non-empty string.');
        }

        validate(options);

        const preferredLocale = options.preferredLocale ?? this.options.preferredLocale;

        return this.fetcher.fetch(slotId, {
            static: false,
            clientId: await this.cidAssigner.assignCid(),
            userToken: this.userTokenProvider.getToken() ?? undefined,
            previewToken: this.previewTokenProvider.getToken() ?? undefined,
            version: options.version,
            preferredLocale: options.preferredLocale,
            context: this.contextFactory.createContext(options.attributes),
            timeout: options.timeout,
            ...(preferredLocale !== undefined ? {preferredLocale: preferredLocale} : {}),
        });
    }
}
