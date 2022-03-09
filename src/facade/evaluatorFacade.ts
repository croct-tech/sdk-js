import {JsonObject, JsonValue} from '@croct/json';
import {Evaluator, Campaign, EvaluationContext, Page} from '../evaluator';
import {Tab} from '../tab';
import {optionsSchema} from '../schema';
import {formatCause} from '../error';

export type EvaluationOptions = {
    timeout?: number,
    attributes?: JsonObject,
};

function validate(options: unknown): asserts options is EvaluationOptions {
    if (typeof options !== 'object' || options === null) {
        throw new Error('The options must be an object.');
    }

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

    public evaluate(expression: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        if (typeof expression !== 'string' || expression.length === 0) {
            throw new Error('The expression must be a non-empty string.');
        }

        validate(options);

        return this.evaluator.evaluate(expression, {
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

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;

        if (timezone !== null) {
            context.timezone = timezone;
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
