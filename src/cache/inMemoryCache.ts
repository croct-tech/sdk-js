import {Cache} from './cache';

export class InMemoryCache implements Cache {
    private cache?: string;

    public constructor(cache?: string) {
        this.cache = cache;
    }

    public get(): string | null {
        return this.cache ?? null;
    }

    public put(value: string): void {
        this.cache = value;
    }

    public clear(): void {
        delete this.cache;
    }
}
