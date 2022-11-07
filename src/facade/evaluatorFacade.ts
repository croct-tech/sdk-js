import {JsonObject, JsonValue} from '@croct/json';
import {Evaluator, Campaign, EvaluationContext, Page} from '../evaluator';
import {Tab} from '../tab';
import {evaluationOptionsSchema as optionsSchema} from '../schema';
import {formatCause} from '../error';

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

export class EvaluatorFacade {
    private readonly evaluator: Evaluator;

    private readonly contextFactory: ContextFactory;

    public constructor(evaluator: Evaluator, contextFactory: ContextFactory) {
        this.evaluator = evaluator;
        this.contextFactory = contextFactory;
    }

    public evaluate(query: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        if (typeof query !== 'string' || query.length === 0) {
            throw new Error('The query must be a non-empty string.');
        }

        validate(options);

        return this.evaluator.evaluate(query, {
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

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;

        if (timeZone !== null) {
            context.timeZone = timeZone;
        }

        const campaign = TabContextFactory.createCampaign(url);

        if (Object.keys(campaign).length > 0) {
            context.campaign = campaign;
        }

        if (attributes !== undefined && Object.keys(attributes).length > 0) {
            context.attributes = attributes;
        }

        return context;
    }

    private static createCampaign(url: URL): Campaign {
        const campaign: Campaign = {};

        for (const [parameter, value] of url.searchParams.entries()) {
            switch (parameter.toLowerCase()) {
                case 'utm_campaign':
                    campaign.name = value;
                    break;

                case 'utm_source':
                    campaign.source = value;
                    break;

                case 'utm_term':
                    campaign.term = value;
                    break;

                case 'utm_medium':
                    campaign.medium = value;
                    break;

                case 'utm_content':
                    campaign.content = value;
                    break;
            }
        }

        return campaign;
    }
}
