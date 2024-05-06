export interface Cache {
    get(): string|null;
    put(value: string): void;
    clear(): void;
}

export interface CacheListener {
    (value: string|null): void;
}

export interface ObservableCache extends Cache {
    addListener(listener: CacheListener): void;

    removeListener(listener: CacheListener): void;
}

export namespace ObservableCache {
    export function isObservable(cache: Cache): cache is ObservableCache {
        return typeof (cache as ObservableCache).addListener === 'function'
            && typeof (cache as ObservableCache).removeListener === 'function';
    }
}
