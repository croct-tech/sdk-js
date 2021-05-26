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
