import CookieCache from '../../src/cache/cookieCache';
import {CookieOptions, getCookie, setCookie, unsetCookie} from '../../src/cookie';

jest.mock('../../src/cookie');

describe('A cookie cache', () => {
    test('should store cache in cookies', async () => {
        const options: CookieOptions = {
            domain: 'foo.com',
            path: '/bar',
            maxAge: 10,
            secure: true,
            sameSite: 'strict',
        };

        const cache = new CookieCache('zita', options);

        (getCookie as jest.Mock).mockReturnValueOnce(null);

        expect(cache.get()).toBeNull();

        expect(getCookie).toBeCalledWith('zita');

        cache.put('foo');

        expect(setCookie).toBeCalledWith('zita', 'foo', options);

        cache.clear();

        expect(unsetCookie).toBeCalledWith('zita');
    });
});
