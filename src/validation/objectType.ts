import {Schema, TypeSchema, Violation} from './schema';
import {MixedSchema} from './mixedSchema';
import {describe, formatPath} from './violation';

type ObjectDefinition = {
    type?: {new (...args: any): any},
    properties: {[key: string]: Schema},
    additionalProperties: boolean | Schema,
    subtypes?: {
        discriminator: string,
        schemas: {[key: string]: ObjectType},
    },
    propertyNames: Schema,
    required: string[],
    minProperties: number,
    maxProperties: number,
};

export class ObjectType implements TypeSchema {
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
        if (this.definition.type !== undefined) {
            return [this.definition.type.name];
        }

        return ['object'];
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public isValidType(value: unknown): value is object {
        if (this.definition.type !== undefined) {
            return value instanceof this.definition.type;
        }

        return Object.prototype.toString.call(value) === '[object Object]';
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            const [type] = this.getTypes();

            throw new Violation(
                `Expected value of type ${type} at path '${formatPath(path)}', `
                + `actual ${describe(value)}.`,
                path,
                {type: type},
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

        const additionalProperties: {[key: string]: any} = {...value};

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

                delete additionalProperties[entryName];

                continue;
            }

            if (this.definition.additionalProperties === false) {
                throw new Violation(`Unknown property '${formatPath(propertyPath)}'.`, propertyPath, {
                    additionalProperty: entryName,
                });
            }

            if (this.definition.additionalProperties !== true) {
                this.definition.additionalProperties.validate(entryValue, propertyPath);
            }
        }

        const {subtypes} = this.definition;

        if (subtypes !== undefined) {
            const type = (value as any)[subtypes.discriminator];

            if (type !== undefined && subtypes.schemas[type] !== undefined) {
                subtypes.schemas[type].validate(additionalProperties, path);
            }
        }
    }
}
