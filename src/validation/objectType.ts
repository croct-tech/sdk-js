import {describe, formatPath, Schema, TypeSchema, Violation} from './index';
import MixedSchema from './mixedSchema';

type ObjectDefinition = {
    properties: {[key: string]: Schema},
    additionalProperties: false | Schema,
    propertyNames: Schema,
    required: string[],
    minProperties: number,
    maxProperties: number,
};

export default class ObjectType implements TypeSchema {
    private readonly definition: ObjectDefinition;

    public constructor(schema: Partial<ObjectDefinition> = {}) {
        this.definition = {
            ...schema,
            properties: schema.properties ?? {},
            required: schema.required ?? [],
            additionalProperties: schema.additionalProperties ?? false,
            propertyNames: schema.propertyNames ?? new MixedSchema(),
            minProperties: schema.minProperties ?? -1,
            maxProperties: schema.maxProperties ?? -1,
        };
    }

    public getTypes(): string[] {
        return ['object'];
    }

    public isValidType(value: unknown): value is object {
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            throw new Violation(
                `Expected value of type object at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'object'},
            );
        }

        const entries = Object.entries(value);

        const {minProperties, maxProperties} = this.definition;

        if (minProperties >= 0 && minProperties > entries.length) {
            throw new Violation(
                `Expected ${minProperties === maxProperties ? 'exactly' : 'at least'} `
                + `${minProperties} ${minProperties === 1 ? 'entry' : 'entries'} `
                + `at path '${formatPath(path)}', actual ${entries.length}.`,
                path,
                {limit: minProperties},
            );
        }

        if (maxProperties >= 0 && maxProperties < entries.length) {
            throw new Violation(
                `Expected ${minProperties === maxProperties ? 'exactly' : 'at most'} `
                + `${maxProperties} ${maxProperties === 1 ? 'entry' : 'entries'} `
                + `at path '${formatPath(path)}', actual ${entries.length}.`,
                path,
                {limit: maxProperties},
            );
        }

        for (const property of this.definition.required) {
            if (!(property in value)) {
                throw new Violation(`Missing property '${formatPath(path.concat([property]))}'.`, path, {
                    required: property,
                });
            }
        }

        for (const [entryName, entryValue] of entries) {
            const propertyPath = path.concat([entryName]);

            this.definition.propertyNames.validate(entryName, propertyPath);

            const propertyRule = this.definition.properties[entryName];

            if (propertyRule !== undefined) {
                propertyRule.validate(entryValue, propertyPath);

                continue;
            }

            if (this.definition.additionalProperties === false) {
                throw new Violation(`Unknown property '${formatPath(propertyPath)}'.`, propertyPath, {
                    additionalProperty: entryName,
                });
            }

            this.definition.additionalProperties.validate(entryValue, propertyPath);
        }
    }
}
