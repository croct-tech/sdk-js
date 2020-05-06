import EvaluatorFacade, {MinimalContextFactory, TabContextFactory} from '../../src/facade/evaluatorFacade';
import Evaluator, {Campaign, EvaluationOptions, Page} from '../../src/evaluator';
import Tab from '../../src/tab';
import {JsonObject} from '../../src/json';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

beforeEach(() => {
    Object.defineProperty(window.document, 'referrer', {
        value: '',
        configurable: true,
    });
});

describe('An evaluator facade', () => {
    let evaluator: Evaluator;

    beforeEach(() => {
        evaluator = jest.genMockFromModule<Evaluator>('../../src/evaluator');
        evaluator.evaluate = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should fail if the expression is empty', () => {
        const factory = new MinimalContextFactory();
        const evaluationFacade = new EvaluatorFacade(evaluator, factory);

        function evaluate(): void {
            evaluationFacade.evaluate('');
        }

        expect(evaluate).toThrow(Error);
        expect(evaluate).toThrow('The expression must be a non-empty string.');
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
        expect(evaluate).toThrow('The options must be an object.');
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

        evaluationFacade.evaluate('foo', {timeout: 5, attributes: {foo: 'bar'}});

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
                timezone: timezone,
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

        expect(evaluator.evaluate).toHaveBeenNthCalledWith(1, 'foo', options);
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
        expect(context.timezone).toBeUndefined();
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
        expect(context.timezone).toBe(timezone);
    });
});
