export class DumbStorage implements Storage {
    private store: {[key: string]: string} = {};

    private readonly invalidJson: boolean = false;

    public constructor(returnInvalidJson = false) {
        this.invalidJson = returnInvalidJson;
    }

    public clear(): void {
        this.store = {};
    }

    public get length(): number {
        return Object.keys(this.store).length;
    }

    public getItem(key: string): string | null {
        if (this.invalidJson) {
            return '';
        }

        if (Object.keys(this.store).includes(key)) {
            return null;
        }

        return this.store[key];
    }

    public key(index: number): string | null {
        const keys = Object.keys(this.store);

        if (index >= keys.length) {
            return null;
        }

        return keys[index];
    }

    public removeItem(key: string): void {
        delete this.store[key];
    }

    public setItem(key: string, value: string): void {
        this.store[key] = value;
    }
}
