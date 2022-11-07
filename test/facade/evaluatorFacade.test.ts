import {JsonObject} from '@croct/json';
import {EvaluatorFacade, MinimalContextFactory, TabContextFactory} from '../../src/facade';
import {Evaluator, Campaign, EvaluationOptions, Page} from '../../src/evaluator';
import {Tab} from '../../src/tab';

const {timeZone} = Intl.DateTimeFormat().resolvedOptions();

beforeEach(() => {
    Object.defineProperty(window.document, 'referrer', {
        value: '',
        configurable: true,
    });
});

describe('An evaluator facade', () => {
    let evaluator: Evaluator;

    beforeEach(() => {
        evaluator = jest.createMockFromModule<{Evaluator: Evaluator}>('../../src/evaluator').Evaluator;

        evaluator.evaluate = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should fail if the query is empty', () => {
        const factory = new MinimalContextFactory();
        const evaluationFacade = new EvaluatorFacade(evaluator, factory);

        function evaluate(): void {
            evaluationFacade.evaluate('');
        }

        expect(evaluate).toThrow(Error);
        expect(evaluate).toThrow('The query must be a non-empty string.');
    });

    test('should fail if the options are invalid', () => {
        const factory = new MinimalContextFactory();
        const evaluationFacade = new EvaluatorFacade(evaluator, factory);

        function evaluate(): void {
            evaluationFacade.evaluate('1 + 1', {timeout: 1.2});
        }

        expect(evaluate).toThrow(Error);
        expect(evaluate).toThrow('Invalid options');
    });

    test('should fail if the options are not a key-value map', () => {
        const factory = new MinimalContextFactory();
        const evaluationFacade = new EvaluatorFacade(evaluator, factory);

        function evaluate(): void {
            evaluationFacade.evaluate('1 + 1', null as unknown as EvaluationOptions);
        }

        expect(evaluate).toThrow(Error);
        expect(evaluate)
            .toThrow('Invalid options: expected value of type object at path \'/\', actual null.');
    });

    test('should delegate the evaluation to the evaluator', () => {
        const url = new URL('http://localhost');
        url.searchParams.append('utm_campaign', 'campaign');
        url.searchParams.append('utm_source', 'source');
        url.searchParams.append('utm_medium', 'medium');
        url.searchParams.append('utm_content', 'content');
        url.searchParams.append('utm_term', 'term');

        const title = 'Welcome to Foo Inc.';
        const referrer = 'http://referrer.com';

        window.history.replaceState({}, 'Landing page', url.href);
        window.document.title = title;

        Object.defineProperty(window.document, 'referrer', {
            value: referrer,
        });

        const tab = new Tab('1', true);
        const evaluationFacade = new EvaluatorFacade(evaluator, new TabContextFactory(tab));

        const options: EvaluationOptions = {
            context: {
                attributes: {
                    foo: 'bar',
                },
                page: {
                    title: title,
                    url: url.toString(),
                    referrer: referrer,
                },
                timeZone: timeZone,
                campaign: {
                    name: 'campaign',
                    source: 'source',
                    medium: 'medium',
                    content: 'content',
                    term: 'term',
                },
            },
            timeout: 5,
        };

        const query = 'foo';

        evaluationFacade.evaluate(query, {
            timeout: options.timeout,
            attributes: options?.context?.attributes,
        });

        expect(evaluator.evaluate).toHaveBeenNthCalledWith(1, query, options);
    });
});

describe('A minimal context factory', () => {
    test('should load a context containing attributes only', () => {
        const factory = new MinimalContextFactory();
        const attributes: JsonObject = {
            foo: 1,
            bar: 2,
        };
        const context = factory.createContext(attributes);

        expect(context.attributes).toEqual(attributes);
        expect(context.campaign).toBeUndefined();
        expect(context.page).toBeUndefined();
        expect(context.timeZone).toBeUndefined();
    });

    test('can load an empty context', () => {
        const factory = new MinimalContextFactory();

        expect(factory.createContext()).toEqual({});
    });
});

describe('A tab context factory', () => {
    test('should load a context containing tab information and attributes', () => {
        const url = new URL('http://localhost');
        url.searchParams.append('UTM_campaign', 'campaign');
        url.searchParams.append('utm_SOURCE', 'source');
        url.searchParams.append('utm_mediuM', 'medium');
        url.searchParams.append('utm_Content', 'content');
        url.searchParams.append('UTM_TERM', 'term');

        const title = 'Welcome to Foo Inc.';
        const referrer = 'http://referrer.com?foo=%22bar%22&foo="bar"';

        window.history.replaceState({}, 'Landing page', url.href);
        window.document.title = title;

        Object.defineProperty(window.document, 'referrer', {
            value: referrer,
            configurable: true,
        });

        const factory = new TabContextFactory(new Tab('1', true));

        const attributes: JsonObject = {
            foo: 1,
            bar: 2,
        };

        const context = factory.createContext(attributes);

        const page: Page = {
            title: title,
            url: window.encodeURI(window.decodeURI(url.toString())),
            referrer: window.encodeURI(window.decodeURI(referrer)),
        };
        const campaign: Campaign = {
            name: 'campaign',
            source: 'source',
            medium: 'medium',
            content: 'content',
            term: 'term',
        };

        expect(context.attributes).toEqual(attributes);
        expect(context.campaign).toEqual(campaign);
        expect(context.page).toEqual(page);
        expect(context.timeZone).toBe(timeZone);
    });
});
