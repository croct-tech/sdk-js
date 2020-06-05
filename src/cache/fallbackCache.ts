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

    public put(value: string | null): void {
        for (const cache of this.caches) {
            cache.put(value);
        }
    }
}
