import {describe, formatPath, Schema, TypeSchema, Violation} from './index';

type ArrayDefinition = {
    minItems: number,
    maxItems: number,
    items?: Schema,
};

export default class ArrayType implements TypeSchema {
    private readonly definition: ArrayDefinition;

    public constructor(definition: Partial<ArrayDefinition> = {}) {
        this.definition = {
            minItems: -1,
            maxItems: -1,
            ...definition,
        };
    }

    public getTypes(): string[] {
        return ['array'];
    }

    public isValidType(value: unknown): value is Array<unknown> {
        return Array.isArray(value);
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            throw new Violation(
                `Expected value of type array at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'string'},
            );
        }

        const {minItems, maxItems} = this.definition;
        const {length} = value;

        if (minItems >= 0 && minItems > length) {
            throw new Violation(
                `Expected ${minItems === maxItems ? 'exactly' : 'at least'} `
                + `${minItems} ${minItems === 1 ? 'item' : 'items'} `
                + `at path '${formatPath(path)}', actual ${length}.`,
                path,
                {limit: minItems},
            );
        }

        if (maxItems >= 0 && maxItems < length) {
            throw new Violation(
                `Expected ${minItems === maxItems ? 'exactly' : 'at most'} `
                + `${maxItems} ${maxItems === 1 ? 'item' : 'items'} `
                + `at path '${formatPath(path)}', actual ${length}.`,
                path,
                {limit: maxItems},
            );
        }

        if (this.definition.items === undefined) {
            return;
        }

        for (let index = 0; index < length; index++) {
            this.definition.items.validate(value[index], path.concat([index.toString()]));
        }
    }
}
