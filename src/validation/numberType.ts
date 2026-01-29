import type {TypeSchema} from './schema';
import {Violation} from './schema';
import {describe, formatPath} from './violation';

type NumberDefinition = {
    integer: boolean,
    minimum: number,
    maximum: number,
};

export class NumberType implements TypeSchema {
    private readonly definition: NumberDefinition;

    public constructor(definition: Partial<NumberDefinition> = {}) {
        this.definition = {
            ...definition,
            integer: definition.integer ?? false,
            minimum: definition.minimum ?? Number.NEGATIVE_INFINITY,
            maximum: definition.maximum ?? Number.POSITIVE_INFINITY,
        };
    }

    public getTypes(): string[] {
        return [this.definition.integer ? 'integer' : 'number'];
    }

    public isValidType(value: unknown): value is number {
        return typeof value === 'number' && (!this.definition.integer || Number.isInteger(value));
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            const type = this.getTypes()[0];

            throw new Violation(
                `Expected value of type ${type} at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: type},
            );
        }

        if (value < this.definition.minimum) {
            throw new Violation(
                `Expected a value greater than or equal to ${this.definition.minimum} `
                + `at path '${formatPath(path)}', actual ${value}.`,
                path,
                {limit: this.definition.minimum},
            );
        }

        if (value > this.definition.maximum) {
            throw new Violation(
                `Expected a value less than or equal to ${this.definition.maximum} `
                + `at path '${formatPath(path)}', actual ${value}.`,
                path,
                {limit: this.definition.maximum},
            );
        }
    }
}
