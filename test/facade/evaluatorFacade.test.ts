import {JsonObject} from '@croct/json';
import {EvaluatorFacade, MinimalContextFactory, TabContextFactory} from '../../src/facade';
import {Evaluator, EvaluationOptions, Page} from '../../src/evaluator';
import {Tab} from '../../src/tab';
import {FixedAssigner} from '../../src/cid';
import {InMemoryTokenStore, FixedTokenProvider, Token} from '../../src/token';
import {EvaluationOptions as FacadeEvaluationOptions} from '../../src/facade/evaluatorFacade';

describe('An evaluator facade', () => {
    let evaluator: Evaluator;

    const {timeZone} = Intl.DateTimeFormat().resolvedOptions();

    beforeEach(() => {
        Object.defineProperty(window.document, 'referrer', {
            value: '',
            configurable: true,
        });
    });

    beforeEach(() => {
        const mock = jest.createMockFromModule<{Evaluator: new() => Evaluator}>('../../src/evaluator');

        evaluator = new mock.Evaluator();

        jest.spyOn(evaluator, 'evaluate').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const clientId = '11111111-1111-1111-1111-111111111111';

    it('should fail if the query is empty', async () => {
        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(evaluationFacade.evaluate('')).rejects
            .toThrowWithMessage(Error, 'The query must be a non-empty string.');
    });

    type Scenario = {
        options: FacadeEvaluationOptions,
        violation: string,
    };

    it('should fail if the options have an invalid timeout amount', async () => {
        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(evaluationFacade.evaluate('1 + 1', {timeout: 1.2})).rejects
            .toThrowWithMessage(
                Error,
                'Invalid options: expected value of type integer '
                + 'at path \'/timeout\', actual number.',
            );
    });

    it.each(Object.entries<Scenario>({
        'object depth greater than 5': {
            options: {
                attributes: {
                    first: {
                        second: {
                            third: {
                                fourth: {
                                    fifth: {},
                                },
                            },
                        },
                    },
                },
            },
            violation: 'Invalid options: expected value of type null, number, boolean or string'
                + ' at path \'/attributes/first/second/third/fourth/fifth\', actual Object.',
        },
        'array depth greater than 5': {
            options: {
                attributes: {
                    first: [
                        [
                            [
                                [
                                    ['fifth level'],
                                ],
                            ],
                        ],
                    ],
                },
            },
            violation: 'Invalid options: expected value of type null, number, boolean or string'
                + ' at path \'/attributes/first/0/0/0/0\', actual array.',
        },
        'invalid value': {
            options: {
                attributes: {
                    foo: undefined,
                },
            },
            violation: 'Invalid options: expected a JSON object at path \'/attributes\', actual Object.',
        },
        'key too short': {
            options: {
                attributes: {
                    '': 'foo',
                },
            },
            violation: 'Invalid options: expected at least 1 character at path \'/attributes/\', actual 0.',
        },
        'key too long': {
            options: {
                attributes: {
                    ['x'.repeat(51)]: 'foo',
                },
            },
            violation: 'Invalid options: expected at most 50 characters'
                + ` at path '/attributes/${'x'.repeat(51)}', actual 51.`,
        },
        'invalid type': {
            options: {
                // @ts-expect-error -- Vanilla js doesn't stop the user from sending invalid values
                attributes: 'foo',
            },
            violation: 'Invalid options: expected a JSON object at path \'/attributes\', actual string.',
        },
        'value too long': {
            options: {
                attributes: {
                    string: 'x'.repeat(256),
                },
            },
            violation: 'Invalid options: expected at most 255 characters at path \'/attributes/string\', actual 256.',
        },
        'nested object value too long': {
            options: {
                attributes: {
                    first: {
                        second: {
                            third: {
                                fourth: {
                                    fifth: 'x'.repeat(256),
                                },
                            },
                        },
                    },
                },
            },
            violation: 'Invalid options: expected at most 255 characters'
                + ' at path \'/attributes/first/second/third/fourth/fifth\', actual 256.',
        },
        'nested array value too long': {
            options: {
                attributes: {
                    first: [
                        [
                            [
                                [
                                    'x'.repeat(256),
                                ],
                            ],
                        ],
                    ],
                },
            },
            violation: 'Invalid options: expected at most 255 characters'
                + ' at path \'/attributes/first/0/0/0/0\', actual 256.',
        },
    }))('should fail if the options have an attribute with %s', async (_, {options, violation}) => {
        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(evaluationFacade.evaluate('1 + 1', options)).rejects.toThrowWithMessage(Error, violation);
    });

    it('should fail if the options are not a key-value map', async () => {
        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(evaluationFacade.evaluate('1 + 1', null as unknown as EvaluationOptions))
            .rejects
            .toThrowWithMessage(Error, 'Invalid options: expected value of type object at path \'/\', actual null.');
    });

    it.each(Object.entries({
        'minimal attributes': {},
        'full attributes': {
            arr: [
                null,
                123,
                'x'.repeat(255),
                true,
                false,
            ],
            first: {
                second: {
                    third: {
                        fourth: {
                            fifth: '',
                            ['x'.repeat(50)]: 'x'.repeat(255),
                        },
                        'fourth-arr': [
                            null,
                            123,
                            'x'.repeat(255),
                            true,
                            false,
                        ],
                    },
                },
            },
        },
    }))('should not fail with %s', async (_, attributes) => {
        const evaluationFacade = new EvaluatorFacade({
            evaluator: evaluator,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(evaluationFacade.evaluate('1 + 1', {attributes: attributes})).resolves.toBeUndefined();
    });

    it('should delegate the evaluation to the evaluator', async () => {
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
    it('should load a context containing attributes only', () => {
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

    it('can load an empty context', () => {
        const factory = new MinimalContextFactory();

        expect(factory.createContext()).toEqual({});
    });
});

describe('A tab context factory', () => {
    const {timeZone} = Intl.DateTimeFormat().resolvedOptions();

    it('should load a context containing tab information and attributes', () => {
        const url = new URL('http://localhost');
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

        expect(context.attributes).toEqual(attributes);
        expect(context.campaign).toBeUndefined();
        expect(context.page).toEqual(page);
        expect(context.timeZone).toBe(timeZone);
    });
});
