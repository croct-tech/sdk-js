import {JsonObject} from '@croct/json';
import {EvaluatorFacade, MinimalContextFactory, TabContextFactory} from '../../src/facade';
import {Evaluator, Campaign, EvaluationOptions, Page} from '../../src/evaluator';
import {Tab} from '../../src/tab';
import {FixedAssigner} from '../../src/cid';
import {InMemoryTokenStore, FixedTokenProvider, Token} from '../../src/token';

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

    const clientId = '11111111-1111-1111-1111-111111111111';

    test('should fail if the query is empty', async () => {
        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(evaluationFacade.evaluate(''))
            .rejects
            .toThrow(new Error('The query must be a non-empty string.'));
    });

    test('should fail if the options are invalid', async () => {
        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(evaluationFacade.evaluate('1 + 1', {timeout: 1.2}))
            .rejects
            .toThrow(new Error('Invalid options: expected value of type integer at path \'/timeout\', actual number.'));
    });

    test('should fail if the options are not a key-value map', async () => {
        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(evaluationFacade.evaluate('1 + 1', null as unknown as EvaluationOptions))
            .rejects
            .toThrow(new Error('Invalid options: expected value of type object at path \'/\', actual null.'));
    });

    test('should delegate the evaluation to the evaluator', async () => {
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
        const token = Token.issue('00000000-0000-0000-0000-000000000000', 'foo', Date.now());

        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(token),
            contextFactory: new TabContextFactory(tab),
        });

        const options: EvaluationOptions = {
            clientId: clientId,
            userToken: token,
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

        await evaluationFacade.evaluate(query, {
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
