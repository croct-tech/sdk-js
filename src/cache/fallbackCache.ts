import Cache from './index';

export default class FallbackCache implements Cache {
    private readonly caches: Cache[];

    public constructor(...caches: Cache[]) {
        this.caches = caches;
    }

    public get(): string|null {
        for (const cache of this.caches) {
            const value = cache.get();

            if (value !== null) {
                return value;
            }
        }

        return null;
    }

    public put(value: string): void {
        this.caches.forEach(cache => cache.put(value));
    }

    public clear(): void {
        this.caches.forEach(cache => cache.clear());
    }
}
