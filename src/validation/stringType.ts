import {TypeSchema, Violation} from './schema';
import {describe, formatPath} from './violation';

interface Format {
    (value: string): boolean;
}

const FORMAT: {[key: string]: Format} = {
    pointer: function identifier(value: string): boolean {
        return /^(\.|([a-zA-Z_][a-zA-Z0-9_]*|\[[0-9]+])(\.[a-zA-Z_][a-zA-Z0-9_]*|\[[0-9]+])*)$/.test(value);
    },
    identifier: function identifier(value: string): boolean {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
    },
    uuid: function uuid(value: string): boolean {
        return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(value);
    },
    date: function date(value: string): boolean {
        return /^(\d\d\d\d)-(\d\d)-(\d\d)$/.test(value);
    },
    url: function date(value: string): boolean {
        try {
            // eslint-disable-next-line no-new
            new URL(value);
        } catch {
            return false;
        }

        return true;
    },
};

type StringDefinition = {
    minLength: number,
    maxLength: number,
    enumeration: string[],
    pattern?: RegExp,
    format?: keyof typeof FORMAT,
};

export class StringType implements TypeSchema {
    private readonly definition: StringDefinition;

    public constructor(definition: Partial<StringDefinition> = {}) {
        this.definition = {
            ...definition,
            minLength: definition.minLength ?? -1,
            maxLength: definition.maxLength ?? -1,
            enumeration: definition.enumeration ?? [],
        };
    }

    public getTypes(): string[] {
        return ['string'];
    }

    public isValidType(value: unknown): value is string {
        return typeof value === 'string';
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            throw new Violation(
                `Expected value of type string at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'string'},
            );
        }

        const {minLength, maxLength} = this.definition;

        if (minLength >= 0 && minLength > value.length) {
            throw new Violation(
                `Expected ${minLength === maxLength ? 'exactly' : 'at least'} `
                + `${minLength} ${minLength === 1 ? 'character' : 'characters'} `
                + `at path '${formatPath(path)}', actual ${value.length}.`,
                path,
                {limit: minLength},
            );
        }

        if (maxLength >= 0 && maxLength < value.length) {
            throw new Violation(
                `Expected ${minLength === maxLength ? 'exactly' : 'at most'} `
                + `${maxLength} ${maxLength === 1 ? 'character' : 'characters'} `
                + `at path '${formatPath(path)}', actual ${value.length}.`,
                path,
                {limit: maxLength},
            );
        }

        const {enumeration} = this.definition;

        if (enumeration.length > 0 && enumeration.indexOf(value) < 0) {
            throw new Violation(
                `Unexpected value at path '${formatPath(path)}', expecting `
                + `'${
                    enumeration.length === 1
                        ? enumeration[0]
                        : `${enumeration.slice(0, -1).join('\', \'')}' or '${enumeration.slice(-1)}`
                }', `
                + `found '${value}'.`,
                path,
                {enumeration},
            );
        }

        const {format, pattern} = this.definition;

        if (format !== undefined && !FORMAT[format](value)) {
            throw new Violation(`Invalid ${format} format at path '${formatPath(path)}'.`, path, {format});
        }

        if (pattern !== undefined && !pattern.test(value)) {
            throw new Violation(`Invalid format at path '${formatPath(path)}'.`, path, {pattern});
        }
    }
}
