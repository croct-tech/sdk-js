import type {CacheListener, ObservableCache} from './cache';

export class LocalStorageCache implements ObservableCache {
    private readonly storage: Storage;

    private readonly key: string;

    private value: string | null;

    private readonly listeners: CacheListener[] = [];

    public constructor(storage: Storage, key: string) {
        this.storage = storage;
        this.key = key;
        this.value = storage.getItem(key);
    }

    public static autoSync(cache: LocalStorageCache): (() => void) {
        const listener = cache.sync.bind(cache);

        window.addEventListener('storage', listener);

        return (): void => window.removeEventListener('storage', listener);
    }

    public get(): string | null {
        return this.value;
    }

    public put(value: string): void {
        this.storage.setItem(this.key, value);

        if (this.value !== value) {
            this.value = value;
            this.notifyChange(value);
        }
    }

    public clear(): void {
        this.storage.removeItem(this.key);

        if (this.value !== null) {
            this.value = null;
            this.notifyChange(null);
        }
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

    private notifyChange(value: string | null): void {
        this.listeners.forEach(listener => listener(value));
    }

    private sync(event: StorageEvent): void {
        if (event.storageArea !== this.storage || (event.key !== null && event.key !== this.key)) {
            // Ignore unrelated changes
            return;
        }

        /*
         * Retrieving the value from the store rather than the event ensures
         * the cache will be in sync with the latest value set.
         * In case of cascading changes, it prevents notifying listeners
         * about intermediate states already outdated at this point.
         */
        const value = this.storage.getItem(this.key);

        if (this.value !== value) {
            this.value = value;
            this.notifyChange(value);
        }
    }
}
