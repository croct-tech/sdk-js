import {Cache} from './cache';

export type CookieCacheConfiguration = {
    name: string,
    secure?: boolean,
    maxAge?: number,
    domain?: string,
    path?: string,
    sameSite?: 'strict' | 'lax' | 'none',
};

export class CookieCache implements Cache {
    private readonly config: CookieCacheConfiguration;

    public constructor(config: CookieCacheConfiguration) {
        this.config = config;
    }

    public get(): string | null {
        const entries = document.cookie.split(';');

        for (const entry of entries) {
            const [name, value] = entry.split('=');

            if (CookieCache.decode(name).trim() === this.config.name) {
                return CookieCache.decode(value.trim());
            }
        }

        return null;
    }

    public put(value: string): void {
        document.cookie = CookieCache.serializeCookie(value, this.config);
    }

    public clear(): void {
        document.cookie = CookieCache.serializeCookie('', {
            ...this.config,
            maxAge: 0,
        });
    }

    private static serializeCookie(value: string, config: CookieCacheConfiguration): string {
        const cookie = [`${CookieCache.encode(config.name)}=${CookieCache.encode(value)}`];

        if (config.maxAge !== undefined) {
            cookie.push(`Max-Age=${config.maxAge}`);
        }

        if (config.domain !== undefined) {
            cookie.push(`Domain=${CookieCache.encode(config.domain)}`);
        }

        if (config.path !== undefined) {
            cookie.push(`Path=${CookieCache.encode(config.path)}`);
        }

        if (config.secure === true) {
            cookie.push('Secure');
        }

        if (config.sameSite !== undefined) {
            cookie.push(`SameSite=${({strict: 'Strict', lax: 'Lax', none: 'None'})[config.sameSite.toLowerCase()]}`);
        }

        return cookie.join('; ');
    }

    private static encode(value: string): string {
        return value.replace(/[,; ]+/g, encodeURIComponent);
    }

    private static decode(value: string): string {
        return decodeURIComponent(value);
    }
}
