import type {JsonObject, JsonValue} from '@croct/json';
import type {Evaluator, EvaluationContext, Page} from '../evaluator';
import type {Tab} from '../tab';
import {evaluationOptionsSchema as optionsSchema} from '../schema';
import {formatCause} from '../error';
import type {TokenProvider} from '../token';
import type {CidAssigner} from '../cid';

export type EvaluationOptions = {
    timeout?: number,
    attributes?: JsonObject,
};

function validate(options: unknown): asserts options is EvaluationOptions {
    try {
        optionsSchema.validate(options);
    } catch (violation) {
        throw new Error(`Invalid options: ${formatCause(violation)}`);
    }
}

export interface ContextFactory {
    createContext(attributes?: JsonObject): EvaluationContext;
}

export type Configuration = {
    evaluator: Evaluator,
    contextFactory: ContextFactory,
    userTokenProvider: TokenProvider,
    cidAssigner: CidAssigner,
};

export class EvaluatorFacade {
    private readonly evaluator: Evaluator;

    private readonly contextFactory: ContextFactory;

    private readonly tokenProvider: TokenProvider;

    private readonly cidAssigner: CidAssigner;

    public constructor(configuration: Configuration) {
        this.evaluator = configuration.evaluator;
        this.contextFactory = configuration.contextFactory;
        this.tokenProvider = configuration.userTokenProvider;
        this.cidAssigner = configuration.cidAssigner;
    }

    public async evaluate(query: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        if (typeof query !== 'string' || query.length === 0) {
            throw new Error('The query must be a non-empty string.');
        }

        validate(options);

        return this.evaluator.evaluate(query, {
            clientId: await this.cidAssigner.assignCid(),
            userToken: this.tokenProvider.getToken() ?? undefined,
            timeout: options.timeout,
            context: this.contextFactory.createContext(options.attributes),
        });
    }
}

export class MinimalContextFactory implements ContextFactory {
    public createContext(attributes?: JsonObject): EvaluationContext {
        if (attributes === undefined) {
            return {};
        }

        return {attributes: attributes};
    }
}

export class TabContextFactory implements ContextFactory {
    private readonly tab: Tab;

    public constructor(tab: Tab) {
        this.tab = tab;
    }

    public createContext(attributes?: JsonObject): EvaluationContext {
        const url = new URL(this.tab.url);
        const context: EvaluationContext = {};

        const page: Page = {
            title: this.tab.title,
            url: url.toString(),
        };

        const {referrer} = this.tab;

        if (referrer.length > 0) {
            page.referrer = referrer;
        }

        context.page = page;

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;

        if (timeZone !== null) {
            context.timeZone = timeZone;
        }

        if (attributes !== undefined && Object.keys(attributes).length > 0) {
            context.attributes = attributes;
        }

        return context;
    }
}
