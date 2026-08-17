/**
 * @jest-environment node
 */
import {EvaluationContext} from '../src/evaluator';

describe('An evaluation context created outside a browser', () => {
    it('should report the page reported by the caller', () => {
        const context = EvaluationContext.createPageContext({
            page: {
                url: 'http://localhost/products/1',
                referrer: 'http://referrer.com/',
            },
        });

        expect(context).toEqual({
            page: {
                url: 'http://localhost/products/1',
                referrer: 'http://referrer.com/',
            },
        });
    });

    it('should not report a page when the caller reports none', () => {
        expect(EvaluationContext.createPageContext()).toEqual({});
    });

    it('should not detect the time zone, as it is not the time zone of the user', () => {
        expect(EvaluationContext.createPageContext({page: {url: 'http://localhost/'}})).not
            .toHaveProperty('timeZone');
    });

    it('should report the time zone reported by the caller', () => {
        const context = EvaluationContext.createPageContext({
            page: {url: 'http://localhost/'},
            timeZone: 'America/Sao_Paulo',
        });

        expect(context.timeZone).toBe('America/Sao_Paulo');
    });

    it('should sanitize the reported URL and referrer', () => {
        const context = EvaluationContext.createPageContext(
            {
                page: {
                    url: 'http://localhost/products/1?token=secret&foo=bar',
                    referrer: 'http://google.com/?token=secret',
                },
            },
            {
                urlSanitizer: url => {
                    const sanitized = new URL(url);

                    sanitized.searchParams.delete('token');

                    return sanitized;
                },
            },
        );

        expect(context.page).toEqual({
            url: 'http://localhost/products/1?foo=bar',
            referrer: 'http://google.com/',
        });
    });
});
