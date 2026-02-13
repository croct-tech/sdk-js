import type {CacheListener, ObservableCache} from './cache';

export type CookieCacheConfiguration = {
    name: string,
    secure?: boolean,
    maxAge?: number,
    domain?: string,
    path?: string,
    sameSite?: 'strict' | 'lax' | 'none',
};

export class CookieCache implements ObservableCache {
    private readonly config: CookieCacheConfiguration;

    private readonly listeners: CacheListener[] = [];

    public constructor(config: CookieCacheConfiguration, defaultSecure = window.location.protocol === 'https:') {
        this.config = {
            ...config,
            path: config.path ?? '/',
        };

        if (defaultSecure && this.config.secure === undefined) {
            this.config.secure = true;
        }

        if (this.config.secure === true && this.config.sameSite === undefined) {
            this.config.sameSite = 'none';
        }
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

    public static autoSync(cache: CookieCache): () => void {
        if (typeof window.cookieStore === 'undefined') {
            return (): void => { /* unsupported */ };
        }

        const listener = cache.sync.bind(cache);

        window.cookieStore.addEventListener('change', listener);

        return (): void => window.cookieStore.removeEventListener('change', listener);
    }

    public addListener(listener: CacheListener): void {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    public removeListener(listener: CacheListener): void {
        const index = this.listeners.indexOf(listener);

        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    private sync(event: CookieChangeEvent): void {
        const isRelevant = [...event.changed, ...event.deleted]
            .some(cookie => cookie.name !== undefined && CookieCache.decode(cookie.name) === this.config.name);

        if (!isRelevant) {
            return;
        }

        this.notifyChange(this.get());
    }

    private notifyChange(value: string | null): void {
        this.listeners.forEach(listener => listener(value));
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
            cookie.push(`SameSite=${({strict: 'Strict', lax: 'Lax', none: 'None'})[config.sameSite]}`);
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
