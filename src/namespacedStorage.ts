export class NamespacedStorage implements Storage {
    private readonly storage: Storage;
    private readonly namespace: string;

    constructor(storage: Storage, namespace: string) {
        if (namespace === '') {
            throw new Error('The namespace cannot be empty.');
        }

        this.storage = storage;
        this.namespace = namespace;
    }

    get length(): number {
        return this.storage.length;
    }

    clear(): void {
        this.storage.clear();
    }

    getItem(key: string): string | null {
        return this.storage.getItem(this.getPrefixedKey(key));
    }

    key(index: number): string | null {
        const keys = this.getKeys();

        if (index >= keys.length) {
            return null;
        }

        return keys[index];
    }

    removeItem(key: string): void {
        this.storage.removeItem(this.getPrefixedKey(key));
    }

    setItem(key: string, value: string): void {
        this.storage.setItem(this.getPrefixedKey(key), value);
    }

    private getKeys(): string[] {
        const keys = [];
        const prefix = this.getPrefix();

        for (let index = 0; index < this.storage.length; index++) {
            const key = this.storage.key(index);

            if (key !== null && key.indexOf(prefix) === 0) {
                keys.push(key);
            }
        }

        return keys;
    }

    private getPrefixedKey(key: string) {
        return this.getPrefix() + key;
    }

    private getPrefix() {
        return this.namespace + '.';
    }
}