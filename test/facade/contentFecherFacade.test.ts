import {MinimalContextFactory, TabContextFactory} from '../../src/facade';
import {Tab} from '../../src/tab';
import {ContentFetcher, FetchOptions} from '../../src/contentFetcher';
import {
    ContentFetcherFacade, FetchOptions as FetchFacadeOptions,
} from '../../src/facade/contentFetcherFacade';

const {timeZone} = Intl.DateTimeFormat().resolvedOptions();

beforeEach(() => {
    Object.defineProperty(window.document, 'referrer', {
        value: '',
        configurable: true,
    });
});

describe('An content fetcher facade', () => {
    let fetcher: ContentFetcher;

    beforeEach(() => {
        fetcher = jest.createMockFromModule<{ContentFetcher: ContentFetcher}>('../../src/contentFetcher')
            .ContentFetcher;

        fetcher.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should fail if the slot ID is empty', () => {
        const factory = new MinimalContextFactory();
        const fetcherFacade = new ContentFetcherFacade(fetcher, factory);

        function fetch(): void {
            fetcherFacade.fetch('');
        }

        expect(fetch).toThrow(new Error('The slot ID must be a non-empty string.'));
    });

    test('should fail if the options are invalid', () => {
        const factory = new MinimalContextFactory();
        const fetcherFacade = new ContentFetcherFacade(fetcher, factory);

        function evaluate(): void {
            fetcherFacade.fetch('home-banner', {timeout: 1.2});
        }

        expect(evaluate).toThrow(Error);
        expect(evaluate).toThrow('Invalid options');
    });

    test('should fail if the options are not a key-value map', () => {
        const factory = new MinimalContextFactory();
        const fetcherFacade = new ContentFetcherFacade(fetcher, factory);

        function evaluate(): void {
            fetcherFacade.fetch('home-banner', null as unknown as FetchFacadeOptions);
        }

        expect(evaluate).toThrow(new Error('The options must be an object.'));
    });

    test('should delegate the fetching to the content fetcher', () => {
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
        const evaluationFacade = new ContentFetcherFacade(fetcher, new TabContextFactory(tab));

        const options: FetchOptions = {
            timeout: 5,
            version: 1,
            preferredLocale: 'en-US',
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
        };

        const slotId = 'home-banner';

        evaluationFacade.fetch(slotId, {
            timeout: options.timeout,
            version: options.version,
            preferredLocale: options.preferredLocale,
            attributes: options?.context?.attributes,
        });

        expect(fetcher.fetch).toHaveBeenNthCalledWith(1, slotId, options);
    });
});
