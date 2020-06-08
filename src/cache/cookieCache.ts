import Cache from './index';
import {CookieOptions, getCookie, setCookie, unsetCookie} from '../cookie';

export default class CookieCache implements Cache {
    private readonly cookieName: string;

    private readonly options?: CookieOptions;

    public constructor(cookieName: string, options?: CookieOptions) {
        this.cookieName = cookieName;
        this.options = options;
    }

    public get(): string|null {
        return getCookie(this.cookieName);
    }

    public put(value: string): void {
        setCookie(this.cookieName, value, this.options);
    }

    public clear(): void {
        unsetCookie(this.cookieName);
    }
}
