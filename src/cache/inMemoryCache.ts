import Cache from './index';

export default class InMemoryCache implements Cache {
    private cache: string | null = null;

    public constructor(cache: string | null = null) {
        this.cache = cache;
    }

    public get(): string | null {
        return this.cache;
    }

    public put(value: string | null): void {
        this.cache = value;
    }
}
