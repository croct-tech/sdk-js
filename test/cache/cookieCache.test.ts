import type {CookieCacheConfiguration} from '../../src/cache/cookieCache';
import {CookieCache} from '../../src/cache/cookieCache';

describe('A cookie cache', () => {
    beforeEach(() => {
        for (const cookie of document.cookie.split(';')) {
            const [name] = cookie.split('=');

            document.cookie = `${name}=; Max-Age=0`;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should cache a value in a cookie', () => {
        const cache = new CookieCache({
            name: 'cid',
        });

        expect(cache.get()).toBeNull();

        cache.put('foo');

        expect(document.cookie).toBe('cid=foo');

        expect(cache.get()).toBe('foo');
    });

    type DefaultOptionsScenario = {
        https?: boolean,
        options: Partial<CookieCacheConfiguration>,
        expectedOptions: {
            Secure?: boolean,
            SameSite?: 'Strict' | 'Lax' | 'None',
        },
    };

    it.each<DefaultOptionsScenario>([
        {
            https: true,
            options: {},
            expectedOptions: {
                Secure: true,
                SameSite: 'None',
            },
        },
        {
            https: true,
            options: {
                secure: false,
            },
            expectedOptions: {
            },
        },
        {
            https: false,
            options: {},
            expectedOptions: {
            },
        },
        {
            https: false,
            options: {
                secure: true,
            },
            expectedOptions: {
                Secure: true,
                SameSite: 'None',
            },
        },
        {
            https: true,
            options: {
                sameSite: 'lax',
            },
            expectedOptions: {
                Secure: true,
                SameSite: 'Lax',
            },
        },
        {
            https: false,
            options: {
                sameSite: 'none',
            },
            expectedOptions: {
                SameSite: 'None',
            },
        },
        {
            https: false,
            options: {
                secure: false,
            },
            expectedOptions: {
            },
        },
        {
            https: undefined,
            options: {},
            expectedOptions: {
            },
        },
    ])('should use default values for missing configuration (https: $https, options: $options)', scenario => {
        const {https, options, expectedOptions} = scenario;
        const cache = new CookieCache({name: 'cid', ...options}, https);

        let jar = '';

        jest.spyOn(document, 'cookie', 'set').mockImplementation(value => {
            jar = value;
        });

        cache.put('foo');

        expect(jar).not.toBeEmpty();

        const cookie: Record<string, string | boolean> = {};

        for (const entry of jar.split(';')) {
            const [name, value = ''] = entry.split('=');

            cookie[decodeURIComponent(name).trim()] = value === '' ? true : decodeURIComponent(value.trim());
        }

        expect(cookie).toEqual({
            cid: 'foo',
            Path: '/',
            ...expectedOptions,
        });
    });

    it('should cache a value using the provided configuration', () => {
        const cache = new CookieCache({
            name: 'cookie name',
            maxAge: 60,
            secure: true,
            domain: window.location.hostname,
            path: '/path with spaces',
            sameSite: 'strict',
        });

        let jar = '';

        jest.spyOn(document, 'cookie', 'set').mockImplementation(value => {
            jar = value;
        });

        cache.put('foo ; bar');

        expect(jar).not.toBeEmpty();

        const cookie: Record<string, string> = {};

        for (const entry of jar.split(';')) {
            const [name, value = ''] = entry.split('=');

            cookie[decodeURIComponent(name).trim()] = decodeURIComponent(value.trim());
        }

        expect(cookie).toEqual({
            'cookie name': 'foo ; bar',
            'Max-Age': '60',
            Domain: window.location.hostname,
            Path: '/path with spaces',
            Secure: '',
            SameSite: 'Strict',
        });
    });

    it('should not flag the cookie as secure if the secure attribute is false', () => {
        const cache = new CookieCache({
            name: 'cid',
            secure: false,
        });

        let jar = '';

        jest.spyOn(document, 'cookie', 'set').mockImplementation(value => {
            jar = value;
        });

        cache.put('foo');

        expect(jar).not.toMatch(/Secure/);
    });

    it.each<[CookieCacheConfiguration['sameSite'], string]>([
        ['strict', 'Strict'],
        ['lax', 'Lax'],
        ['none', 'None'],
    ])('should normalize the same-site attribute from %s to %s', (input, output) => {
        const cache = new CookieCache({
            name: 'cid',
            sameSite: input,
        });

        let jar = '';

        jest.spyOn(document, 'cookie', 'set').mockImplementation(value => {
            jar = value;
        });

        cache.put('foo');

        expect(jar).toMatch(new RegExp(`SameSite\\s*=\\s*${output}`));
    });

    it('should encode and decode cookie values', () => {
        const cache = new CookieCache({
            // Use special characters to test encoding and decoding
            name: 'cookie;name',
        });

        cache.put(' cookie,value ');

        expect(document.cookie).toBe('cookie%3Bname=%20cookie%2Cvalue%20');

        expect(cache.get()).toBe(' cookie,value ');

        cache.clear();

        expect(document.cookie).toBe('');
    });

    it('should clear a value from a cookie', () => {
        const cache = new CookieCache({
            name: 'cid',
        });

        cache.put('foo');

        expect(document.cookie).toBe('cid=foo');

        cache.clear();

        expect(document.cookie).toBe('');

        expect(cache.get()).toBeNull();
    });
});
