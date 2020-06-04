import {getBaseDomain, getCookie, setCookie, unsetCookie} from '../src/cookie';

let cookieSetter: jest.Mock = jest.fn();
let cookieGetter: jest.Mock = jest.fn();

beforeEach(() => {
    cookieSetter = jest.fn();
    cookieGetter = jest.fn();

    Object.defineProperty(window.document, 'cookie', {
        set: cookieSetter,
        get: cookieGetter,
        configurable: true,
    });
});

describe('A function to detect the base domain', () => {
    test('should detect the top-most domain that allows for setting cookies', () => {
        let cookie = '';
        cookieSetter.mockImplementation(value => {
            cookie = value;
        });

        cookieGetter.mockImplementation(() => (cookie.includes('croct') ? cookie : ''));

        expect(getBaseDomain('www.croct.com.br')).toBe('croct.com.br');

        expect(cookieSetter).toBeCalledTimes(3);
        expect(cookieSetter).toHaveBeenNthCalledWith(1, expect.stringMatching(/^.+=.+; Domain=com\.br;$/i));
        expect(cookieSetter).toHaveBeenNthCalledWith(2, expect.stringMatching(/^.+=.+; Domain=croct\.com\.br;$/i));
        expect(cookieSetter).toHaveBeenNthCalledWith(
            3,
            expect.stringMatching(/^.+=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=croct\.com\.br;$/i),
        );
    });

    test('should return the provided domain if the base domain cannot be detected', () => {
        cookieGetter.mockReturnValue('');

        expect(getBaseDomain('www.croct.com.br')).toBe('www.croct.com.br');

        expect(cookieSetter).toBeCalledTimes(3);
        expect(cookieSetter).toHaveBeenNthCalledWith(1, expect.stringMatching(/^.+=.+; Domain=com\.br;$/i));
        expect(cookieSetter).toHaveBeenNthCalledWith(2, expect.stringMatching(/^.+=.+; Domain=croct\.com\.br;$/i));
        expect(cookieSetter).toHaveBeenNthCalledWith(3, expect.stringMatching(/^.+=.+; Domain=www.croct\.com\.br;$/i));
    });
});

describe('A function to set cookies', () => {
    test('should set cookies according to the specified options', () => {
        setCookie('foo', 'bar');

        expect(cookieSetter).toHaveBeenCalledWith('foo=bar;');

        setCookie('foo', 'bar', {
            domain: 'foo.com',
            path: '/bar',
            maxAge: 10,
            secure: true,
            sameSite: 'strict',
        });

        expect(cookieSetter)
            .toHaveBeenCalledWith('foo=bar; Secure; Max-Age=10; Domain=foo.com; Path=/bar; SameSite=strict;');
    });

    test('should escape the cookie name and value', () => {
        setCookie('foo=', 'bar;');

        expect(cookieSetter).toHaveBeenCalledWith('foo%3D=bar%3B;');
    });
});

describe('A function to unset cookies', () => {
    test('should unset cookies by setting an expiration date in the past', () => {
        unsetCookie('foo');

        expect(cookieSetter).toHaveBeenCalledWith('foo=; Expires=Thu, 01 Jan 1970 00:00:01 GMT;');
    });

    test('should escape the cookie name', () => {
        unsetCookie('foo=');

        expect(cookieSetter).toHaveBeenCalledWith('foo%3D=; Expires=Thu, 01 Jan 1970 00:00:01 GMT;');
    });
});

describe('A function to read cookies', () => {
    test('should return null if the cookie does not exist', () => {
        cookieGetter.mockReturnValue('');

        expect(getCookie('foo')).toBeNull();
    });

    test('should get the value of the cookie by name', () => {
        cookieGetter.mockReturnValue('foo=a; bar=b;');

        expect(getCookie('foo')).toBe('a');
        expect(getCookie('bar')).toBe('b');
    });

    test('should unescape the cookie name and value', () => {
        cookieGetter.mockReturnValue('foo%3D=bar%3B;');

        expect(getCookie('foo=')).toBe('bar;');
    });
});
