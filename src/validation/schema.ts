export interface Schema {
    validate(value: unknown, path?: string[]): void;
}

export interface TypeSchema extends Schema {
    getTypes(): string[];

    isValidType(value: unknown): boolean;
}

export class Violation extends Error {
    public readonly path: string[];

    public readonly params: {[key: string]: unknown};

    public constructor(message: string, path: string[], params: {[p: string]: unknown}) {
        super(message);
        this.path = path;
        this.params = params;
    }
}
