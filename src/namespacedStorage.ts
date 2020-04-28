export default class NamespacedStorage implements Storage {
    private readonly storage: Storage;

    private readonly namespace: string;

    public constructor(storage: Storage, namespace: string) {
        if (namespace === '') {
            throw new Error('The namespace cannot be empty.');
        }

        this.storage = storage;
        this.namespace = namespace;
    }

    public get length(): number {
        return this.getKeys().length;
    }

    public clear(): void {
        for (const key of this.getKeys()) {
            this.storage.removeItem(key);
        }
    }

    public getItem(key: string): string | null {
        return this.storage.getItem(this.getPrefixedKey(key));
    }

    public key(index: number): string | null {
        const keys = this.getKeys();

        if (index >= keys.length) {
            return null;
        }

        return keys[index].substring(this.namespace.length + 1);
    }

    public removeItem(key: string): void {
        this.storage.removeItem(this.getPrefixedKey(key));
    }

    public setItem(key: string, value: string): void {
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

    private getPrefixedKey(key: string): string {
        return this.getPrefix() + key;
    }

    private getPrefix(): string {
        return `${this.namespace}.`;
    }
}
