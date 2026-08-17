import {EvaluationContext} from '../src/evaluator';

describe('An evaluation context', () => {
    const timeZone = 'America/Sao_Paulo';

    beforeEach(() => {
        window.history.replaceState({}, '', 'http://localhost/');

        window.document.title = '';

        setReferrer('');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function setReferrer(referrer: string): void {
        Object.defineProperty(window.document, 'referrer', {
            value: referrer,
            configurable: true,
        });
    }

    function setTimeZone(zone: string): void {
        jest.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
            .mockReturnValue({timeZone: zone} as Intl.ResolvedDateTimeFormatOptions);
    }

    it('should describe the page currently open in the browser', () => {
        setTimeZone(timeZone);
        setReferrer('http://referrer.com/');

        window.history.replaceState({}, '', 'http://localhost/products/1?foo=bar');

        window.document.title = 'Product 1';

        expect(EvaluationContext.createPageContext()).toEqual({
            page: {
                url: 'http://localhost/products/1?foo=bar',
                title: 'Product 1',
                referrer: 'http://referrer.com/',
            },
            timeZone: timeZone,
        });
    });

    it('should omit the title and the referrer when the page has none', () => {
        setTimeZone(timeZone);

        expect(EvaluationContext.createPageContext()).toEqual({
            page: {url: 'http://localhost/'},
            timeZone: timeZone,
        });
    });

    it('should omit the time zone when it cannot be detected', () => {
        setTimeZone('Etc/Unknown');

        expect(EvaluationContext.createPageContext()).not.toHaveProperty('timeZone');
    });

    it('should extend the captured page with the reported one', () => {
        setTimeZone(timeZone);
        setReferrer('http://referrer.com/');

        window.document.title = 'Product 1';

        const context = EvaluationContext.createPageContext({
            page: {url: 'http://localhost/products/2'},
        });

        expect(context).toEqual({
            page: {
                url: 'http://localhost/products/2',
                title: 'Product 1',
                referrer: 'http://referrer.com/',
            },
            timeZone: timeZone,
        });
    });

    it('should give precedence to the reported values', () => {
        setTimeZone(timeZone);
        setReferrer('http://referrer.com/');

        window.document.title = 'Product 1';

        const context = EvaluationContext.createPageContext({
            page: {
                url: 'http://localhost/products/2',
                title: 'Product 2',
                referrer: 'http://google.com/',
            },
            timeZone: 'Europe/Lisbon',
        });

        expect(context).toEqual({
            page: {
                url: 'http://localhost/products/2',
                title: 'Product 2',
                referrer: 'http://google.com/',
            },
            timeZone: 'Europe/Lisbon',
        });
    });

    it('should normalize the URL of the page', () => {
        expect(EvaluationContext.createPageContext({page: {url: 'http://localhost'}}).page.url)
            .toBe('http://localhost/');
    });

    it('should reject a relative URL', () => {
        // The error comes from the realm of the document, so only the message is checked
        expect(() => EvaluationContext.createPageContext({page: {url: '/products/1'}}))
            .toThrow('Invalid URL');
    });

    it('should report the campaign and the attributes', () => {
        setTimeZone(timeZone);

        const context = EvaluationContext.createPageContext({
            page: {url: 'http://localhost/'},
            campaign: {name: 'black-friday'},
            attributes: {plan: 'pro'},
        });

        expect(context).toEqual({
            page: {url: 'http://localhost/'},
            campaign: {name: 'black-friday'},
            attributes: {plan: 'pro'},
            timeZone: timeZone,
        });
    });

    it('should omit empty attributes', () => {
        setTimeZone(timeZone);

        const context = EvaluationContext.createPageContext({
            page: {url: 'http://localhost/'},
            attributes: {},
        });

        expect(context).not.toHaveProperty('attributes');
    });
});
