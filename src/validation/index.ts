export function formatPath(path: string[]): string {
    return `/${path.join('/')}`;
}

export function describe(value: unknown): string {
    if (value === null) {
        return 'null';
    }

    if (Array.isArray(value)) {
        return 'array';
    }

    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'integer' : 'number';
    }

    if (typeof value === 'object') {
        return (value as object).constructor.name;
    }

    return typeof value;
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

export interface Schema {
    validate(value: unknown, path?: string[]): void;
}

export interface TypeSchema extends Schema {
    getTypes(): string[];

    isValidType(value: unknown): boolean;
}
