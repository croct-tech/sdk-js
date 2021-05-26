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
        // eslint-disable-next-line @typescript-eslint/ban-types
        return (value as object).constructor.name;
    }

    return typeof value;
}

export function formatPath(path: string[]): string {
    return `/${path.join('/')}`;
}
