import {Schema, TypeSchema, Violation} from './schema';
import {JsonArray, JsonObject, JsonPrimitive, JsonValue} from '../json';
import {describe, formatPath} from './violation';

function isJsonPrimitive(value: unknown): value is JsonPrimitive {
    return value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number';
}

function isJsonArray(value: unknown): value is JsonArray {
    return Array.isArray(value) && value.every(isJsonValue);
}

function isJsonValue(value: unknown): value is JsonValue {
    return isJsonPrimitive(value) || isJsonArray(value) || isJsonObject(value);
}

function isJsonObject(value: unknown): value is JsonObject {
    return isPlainObject(value) && Object.values(value).every(isJsonValue);
}

// eslint-disable-next-line @typescript-eslint/ban-types
function isPlainObject(value: unknown): value is object {
    return Object.prototype.toString.call(value) === '[object Object]';
}

type JsonObjectDefinition = {
    properties?: Schema,
    propertyNames?: Schema,
};

export class JsonObjectType implements TypeSchema {
    private readonly definition: JsonObjectDefinition;

    public constructor(definition: JsonObjectDefinition = {}) {
        this.definition = definition;
    }

    public getTypes(): string[] {
        return ['object'];
    }

    public isValidType(value: unknown): boolean {
        return isPlainObject(value);
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!isJsonObject(value)) {
            throw new Violation(
                `Expected a JSON object at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'object'},
            );
        }

        if (this.definition.properties === undefined && this.definition.propertyNames === undefined) {
            return;
        }

        for (const [entryName, entryValue] of Object.entries(value)) {
            const propertyPath = path.concat([entryName]);

            if (this.definition.propertyNames !== undefined) {
                this.definition.propertyNames.validate(entryName, propertyPath);
            }

            if (this.definition.properties !== undefined) {
                this.definition.properties.validate(entryValue, path.concat([entryName]));
            }
        }
    }
}

type JsonArrayDefinition = {
    items?: Schema,
};

export class JsonArrayType implements TypeSchema {
    private readonly definition: JsonArrayDefinition;

    public constructor(definition: JsonArrayDefinition = {}) {
        this.definition = definition;
    }

    public getTypes(): string[] {
        return ['array'];
    }

    public isValidType(value: unknown): boolean {
        return Array.isArray(value);
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!isJsonArray(value)) {
            throw new Violation(
                `Expected a JSON array at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'array'},
            );
        }

        if (this.definition.items === undefined) {
            return;
        }

        for (let index = 0; index < value.length; index++) {
            this.definition.items.validate(value[index], path.concat([index.toString()]));
        }
    }
}

export class JsonPrimitiveType implements TypeSchema {
    public getTypes(): string[] {
        return ['null', 'number', 'string', 'boolean'];
    }

    public isValidType(value: unknown): boolean {
        return isJsonPrimitive(value);
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            throw new Violation(
                `Expected a JSON primitive at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: this.getTypes().join('|')},
            );
        }
    }
}

export class JsonType implements TypeSchema {
    public getTypes(): string[] {
        return ['null', 'number', 'string', 'boolean', 'array', 'object'];
    }

    public isValidType(value: unknown): boolean {
        return isJsonPrimitive(value) || Array.isArray(value) || isPlainObject(value);
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!isJsonValue(value)) {
            throw new Violation(
                `Expected a JSON value at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: this.getTypes().join('|')},
            );
        }
    }
}
