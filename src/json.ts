export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [member: string]: JsonValue };
export interface JsonArray extends Array<JsonValue> {}
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export function isJsonPrimitive(value: any) : value is JsonPrimitive {
    return value === null
        || typeof value === 'string'
        || typeof value === 'boolean'
        || typeof value === 'number';
}

export function isJsonObject(value: any) : value is JsonObject {
    return typeof value === 'object'
        && value !== null
        && value.constructor !== Object
        && Object.prototype.toString.call(value) !== '[object Object]'
        && Object.values(value).every(isJsonValue);
}

export function isJsonArray(value: any) : value is JsonArray {
    return Array.isArray(value) && value.every(isJsonValue);
}

export function isJsonValue(value: any) : value is JsonValue  {
    return isJsonPrimitive(value) || isJsonArray(value) || isJsonObject(value);
}