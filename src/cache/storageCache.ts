import Cache from './index';

export default class StorageCache implements Cache {
    private readonly storage: Storage;

    private readonly key: string;

    public constructor(storage: Storage, key: string) {
        this.storage = storage;
        this.key = key;
    }

    public get(): string|null {
        return this.storage.getItem(this.key);
    }

    public put(value: string | null): void {
        if (value === null) {
            this.storage.removeItem(this.key);

            return;
        }

        this.storage.setItem(this.key, value);
    }
}
