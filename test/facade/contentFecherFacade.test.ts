import {MinimalContextFactory, TabContextFactory} from '../../src/facade';
import {Tab} from '../../src/tab';
import type {ContentFetcher, FetchOptions} from '../../src/contentFetcher';
import type {FetchOptions as FetchFacadeOptions} from '../../src/facade/contentFetcherFacade';
import {ContentFetcherFacade} from '../../src/facade/contentFetcherFacade';
import {FixedAssigner} from '../../src/cid';
import {InMemoryTokenStore, FixedTokenProvider, Token} from '../../src/token';

describe('A content fetcher facade', () => {
    let fetcher: ContentFetcher;

    const {timeZone} = Intl.DateTimeFormat().resolvedOptions();

    beforeEach(() => {
        Object.defineProperty(window.document, 'referrer', {
            value: '',
            configurable: true,
        });
    });

    beforeEach(() => {
        const mock = jest.createMockFromModule<{ContentFetcher: new() => ContentFetcher}>('../../src/contentFetcher');

        fetcher = new mock.ContentFetcher();

        jest.spyOn(fetcher, 'fetch').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const clientId = '11111111-1111-1111-1111-111111111111';

    it('should fail if the slot ID is empty', async () => {
        const fetcherFacade = new ContentFetcherFacade({
            contentFetcher: fetcher,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            previewTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(fetcherFacade.fetch('')).rejects
            .toThrowWithMessage(Error, 'The slot ID must be a non-empty string.');
    });

    it('should fail if the options are invalid', async () => {
        const fetcherFacade = new ContentFetcherFacade({
            contentFetcher: fetcher,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            previewTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(fetcherFacade.fetch('home-banner', {timeout: 1.2})).rejects
            .toThrow('Invalid options');
    });

    it('should fail if the options are not a key-value map', async () => {
        const fetcherFacade = new ContentFetcherFacade({
            contentFetcher: fetcher,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new InMemoryTokenStore(),
            previewTokenProvider: new InMemoryTokenStore(),
            contextFactory: new MinimalContextFactory(),
        });

        await expect(() => fetcherFacade.fetch('home-banner', null as unknown as FetchFacadeOptions))
            .rejects
            .toThrowWithMessage(Error, 'Invalid options: expected value of type object at path \'/\', actual null.');
    });

    it('should delegate the fetching to the content fetcher', async () => {
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
        const userToken = Token.issue('00000000-0000-0000-0000-000000000000', 'foo', Date.now());
        const previewToken = Token.issue('11111111-1111-1111-1111-111111111111', 'bar', Date.now());

        const fetcherFacade = new ContentFetcherFacade({
            contentFetcher: fetcher,
            cidAssigner: new FixedAssigner(clientId),
            userTokenProvider: new FixedTokenProvider(userToken),
            previewTokenProvider: new FixedTokenProvider(previewToken),
            contextFactory: new TabContextFactory(tab),
        });

        const options: FetchOptions = {
            static: false,
            clientId: clientId,
            userToken: userToken,
            previewToken: previewToken,
            timeout: 5,
            version: 1,
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
        };

        const slotId = 'home-banner';

        await fetcherFacade.fetch(slotId, {
            timeout: options.timeout,
            version: options.version,
            attributes: options?.context?.attributes,
        });

        expect(fetcher.fetch).toHaveBeenNthCalledWith(1, slotId, options);

        await fetcherFacade.fetch(slotId, {
            timeout: options.timeout,
            version: options.version,
            attributes: options?.context?.attributes,
            preferredLocale: 'en-us',
        });

        expect(fetcher.fetch).toHaveBeenNthCalledWith(2, slotId, {
            ...options,
            preferredLocale: 'en-us',
        });

        await fetcherFacade.fetch(slotId, {
            timeout: options.timeout,
            version: options.version,
            attributes: options?.context?.attributes,
            includeSchema: true,
        });

        expect(fetcher.fetch).toHaveBeenNthCalledWith(3, slotId, {
            ...options,
            includeSchema: true,
        });
    });
});
