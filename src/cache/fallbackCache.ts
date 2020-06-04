import Cache from './index';

export default class FallbackCache implements Cache {
    private readonly caches: Cache[];

    public constructor(...caches: Cache[]) {
        this.caches = caches;
    }

    public get(): string|null {
        for (const cache of this.caches) {
            const cid = cache.get();

            if (cid !== null) {
                return cid;
            }
        }

        return null;
    }

    public put(cid: string | null): void {
        for (const cache of this.caches) {
            cache.put(cid);
        }
    }
}
