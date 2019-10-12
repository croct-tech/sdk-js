function formatPath(path: string[]) : string {
    return '/' + path.join('/');
}

function describe(value: any) : string {
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
        return value.constructor ? value.constructor.name : 'object';
    }

    return name;
}

export class Violation extends Error {
    public readonly path: string[];
    public readonly params: {[key: string]: any};

    constructor(message: string, path: string[], params: {[p: string]: any }) {
        super(message);
        this.path = path;
        this.params = params;
    }
}

export interface Schema {
    validate(value: any, path?: string[]) : void;
}

export class AnyType implements Schema {
    validate(value: any, path: string[]): void {
    }
}

type StringSchema = {
    minLength: number,
    maxLength: number,
    pattern?: RegExp,
    enumeration: string[]
}

export class StringType implements Schema {
    private readonly schema: StringSchema;

    constructor(schema: Partial<StringSchema>) {
        this.schema = {
            minLength: -1,
            maxLength: -1,
            enumeration: [],
            ...schema
        };
    }

    validate(value: any, path: string[]): void {
        if (typeof value !== 'string') {
            throw new Violation(
                `Expected value of type string at ${formatPath(path)}, found ${describe(value)}.`,
                path,
                {type: 'string'}
            );
        }

        const {minLength, maxLength} = this.schema;

        if (minLength >= 0 && minLength > value.length) {
            throw new Violation(
                `Expected ${minLength === maxLength ? 'exactly' : 'at least'} ` +
                `${minLength} ${minLength === 1 ? 'character' : 'characters'} ` +
                `at ${formatPath(path)}, found ${value.length}.`,
                path,
                {limit: minLength}
            );
        }

        if (maxLength >= 0 && maxLength > value.length) {
            throw new Violation(
                `Expected ${minLength === maxLength ? 'exactly' : 'at most'} ` +
                `${maxLength} ${maxLength === 1 ? 'character' : 'characters'} ` +
                `at ${formatPath(path)}, found ${value.length}.`,
                path,
                {limit: maxLength}
            );
        }

        const {enumeration, pattern} = this.schema;

        if (enumeration.length > 0 && enumeration.indexOf(value) < 0) {
            throw new Violation(
                `Unexpected value at ${formatPath(path)}, expecting ` +
                `'${enumeration.length === 1 
                    ? enumeration[0] 
                    : enumeration.slice(0, -1).join("', '") + "' or '" + enumeration.slice(-1)}', ` +
                `found '${value}'.`,
                path,
                {enumeration: enumeration}
            );
        }

        if (pattern !== undefined && !pattern.test(value)) {
            throw new Violation(
                `Invalid string format at ${formatPath(path)}.`,
                path,
                {pattern: pattern}
            );
        }
    }
}

type NumberSchema = {
    integer: boolean,
    minimum: number,
    maximum: number
}

export class NumberType implements Schema {
    private readonly schema: NumberSchema;

    constructor(schema: Partial<NumberSchema>) {
        this.schema = {
            integer: false,
            minimum: Number.NEGATIVE_INFINITY,
            maximum: Number.POSITIVE_INFINITY,
            ...schema
        };
    }

    validate(value: any, path: string[] = []): void {
        if (typeof value !== 'number' || (this.schema.integer && !Number.isInteger(value))) {
            const type = this.schema.integer ? 'integer' : 'number';

            throw new Violation(
                `Expected value of type ${type} at ${formatPath(path)}, found ${describe(value)}.`,
                path,
                {type: type}
            );
        }

        if (value < this.schema.minimum) {
            throw new Violation(
                `Expected a value greater than or equal to ${this.schema.minimum} ` +
                `at ${formatPath(path)}, found ${value}.`,
                path,
                {limit: this.schema.minimum}
            );
        }

        if (value > this.schema.maximum) {
            throw new Violation(
                `Expected a value less than or equal to ${this.schema.maximum} ` +
                `at ${formatPath(path)}, found ${value}.`,
                path,
                {limit: this.schema.maximum}
            );
        }

    }
}

export class BooleanType implements Schema {
    validate(value: any, path: string[] = []): void {
        if (typeof value !== 'boolean') {
            throw new Violation(
                `Expected value of type boolean at ${formatPath(path)}, found ${describe(value)}.`,
                path,
                {type: 'boolean'}
            );
        }
    }
}

type ArraySchema = {
    minItems: number,
    maxItems: number,
    items?: Schema
}

export class ArrayType implements Schema {
    private readonly schema: ArraySchema;

    constructor(schema: Partial<ArraySchema>) {
        this.schema = {
            minItems: -1,
            maxItems: -1,
            ...schema
        };
    }

    validate(value: any, path: string[] = []): void {
        if (!Array.isArray(value)) {
            throw new Violation(
                `Expected value of type array at ${formatPath(path)}, found ${describe(value)}.`,
                path,
                {type: 'string'}
            );
        }

        const {minItems, maxItems} = this.schema;
        const length = value.length;

        if (minItems >= 0 && minItems > length) {
            throw new Violation(
                `Expected ${minItems === maxItems ? 'exactly' : 'at least'} ` +
                `${minItems} ${minItems === 1 ? 'item' : 'items'} ` +
                `at ${formatPath(path)}, found ${length}.`,
                path,
                {limit: minItems}
            );
        }

        if (maxItems >= 0 && maxItems > length) {
            throw new Violation(
                `Expected ${minItems === maxItems ? 'exactly' : 'at most'} ` +
                `${maxItems} ${maxItems === 1 ? 'item' : 'items'} ` +
                `at ${formatPath(path)}, found ${length}.`,
                path,
                {limit: maxItems}
            );
        }

        if (this.schema.items === undefined) {
            return;
        }

        for (let index = 0; index < length; index++) {
            this.schema.items.validate(value[index], path.concat([index.toString()]));
        }
    }
}

type ObjectSchema = {
    properties: {[key: string]: Schema},
    additionalProperties: false | Schema
    propertyNames: Schema
    required: string[],
    minProperties: number,
    maxProperties: number
}

export class ObjectType implements Schema {
    private readonly schema: ObjectSchema;

    constructor(schema: Partial<ObjectSchema>) {
        this.schema = {
            properties: {},
            required: [],
            additionalProperties: false,
            propertyNames: new AnyType(),
            minProperties: -1,
            maxProperties: -1,
            ...schema
        };
    }

    validate(value: any, path: string[] = []): void {
        if (typeof value !== 'object' || value === null || value.constructor !== Object) {
            throw new Violation(
                `Expected value of type object at ${formatPath(path)}, found ${describe(value)}.`,
                path,
                {type: 'object'}
            );
        }

        const entries = Object.entries(value);

        const {minProperties, maxProperties} = this.schema;

        if (minProperties >= 0 && minProperties > entries.length) {
            throw new Violation(
                `Expected ${minProperties === maxProperties ? 'exactly' : 'at least'} ` +
                `${minProperties} ${minProperties === 1 ? 'property' : 'properties'} ` +
                `at ${formatPath(path)}, found ${entries.length}.`,
                path,
                {limit: minProperties}
            );
        }

        if (maxProperties >= 0 && maxProperties < entries.length) {
            throw new Violation(
                `Expected ${minProperties === maxProperties ? 'exactly' : 'at most'} ` +
                `${maxProperties} ${maxProperties === 1 ? 'property' : 'properties'} ` +
                `at ${formatPath(path)}, found ${entries.length}.`,
                path,
                {limit: maxProperties}
            );
        }

        for (let property of this.schema.required) {
            if (!value.hasOwnProperty(property)) {
                throw new Violation(
                    `Missing property ${formatPath(path.concat([property]))}.`,
                    path,
                    {required: property}
                );
            }
        }

        for (let [name, value] of entries) {
            const propertyPath = path.concat([name]);

            this.schema.propertyNames.validate(name, propertyPath);

            const propertyRule = this.schema.properties[name];

            if (propertyRule !== undefined) {
                propertyRule.validate(value, propertyPath);

                continue;
            }

            if (this.schema.additionalProperties === false) {
                throw new Violation(
                    `Unknown property ${formatPath(propertyPath)}.`,
                    propertyPath,
                    {additionalProperty: name}
                );
            }

            this.schema.additionalProperties.validate(value, propertyPath);
        }
    }
}