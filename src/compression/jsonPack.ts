import {JsonArray, JsonObject, JsonValue} from '../json';

type JsonPackedObject = [number, ...JsonValue[]];

export function pack(data : JsonValue) : JsonValue {
    const schemas: {[key: string]: number} = {};
    let maxSchemaIndex = 0;

    function encode(value: JsonValue) : JsonValue {
        if (typeof value !== 'object' || !value) {
            // non-objects or null return as is
            return value;
        }

        if (Array.isArray(value)) {
            return encodeArray(value);
        }

        return encodeObject(value);
    }

    function encodeArray(value: JsonArray) : JsonArray {
        const length = value.length;
        const encoded: JsonArray = [];

        if (length === 0) {
            return [];
        }

        if (typeof value[0] === 'number') {
            // 0 is schema index for Array
            encoded.push(0);
        }

        for (let i = 0; i < length; i++) {
            let element = value[i];
            let current = encode(element);
            let last = encoded[encoded.length - 1];

            if (isPackedObject(current) && Array.isArray(last) && current[0] === last[0]) {
                // current and previous object have same schema,
                // so merge their values into one array
                encoded[encoded.length - 1] = last.concat(current.slice(1));
            } else {
                encoded.push(current);
            }
        }

        return encoded;
    }

    function encodeObject(value: JsonObject) : JsonPackedObject | JsonObject {
        const schemaKeys = Object.keys(value).sort();
        const schemaLength = schemaKeys.length;

        if (schemaLength === 0) {
            return {};
        }

        const schemaHash = schemaLength + ':' + schemaKeys.join('|');
        const schemaIndex = schemas[schemaHash];

        if (schemaIndex !== undefined) {
            // known schema
            const encoded: JsonPackedObject = [schemaIndex];

            for (let i = 0; i < schemaLength; i++) {
                encoded[i] = encode(value[schemaKeys[i]]);
            }

            return encoded;
        }

        // new schema
        schemas[schemaHash] = ++maxSchemaIndex;

        const encoded: JsonObject = {};

        for (let i = 0, key = schemaKeys[i]; i < schemaLength; key = schemaKeys[i++]) {
            encoded[key] = encode(value[key]);
        }

        return encoded;
    }

    return encode(data);
}

export function unpack(data: JsonValue) : JsonValue {
    const schemas: {[key: number]: string[]} = {};
    let maxSchemaIndex = 0;

    function decode(value: JsonValue) : JsonValue {
        if (typeof value !== 'object' || !value) {
            // non-objects or null return as is
            return value;
        }

        if (!Array.isArray(value)) {
            // object with new schema
            return decodePrototypeObject(value);
        }

        if (value.length === 0) {
            return [];
        }

        if (isPackedObject(value)) {
            return decodeObject(value);
        }

        return decodeArray(value);
    }

    function decodeArray(value: JsonArray) : JsonArray {
        const length = value.length;
        let decoded: JsonValue[] = [];

        for (let i = (value[0] === 0 ? 1 : 0); i < length; i++) {
            const element = value[i];
            const object = decode(element);

            if (isPackedObject(element) && Array.isArray(object)) {
                // several objects was encoded into single array
                decoded = decoded.concat(object);
            } else {
                decoded.push(object);
            }
        }

        return decoded;
    }

    function decodeObject(value: JsonPackedObject) : JsonObject | JsonArray {
        const schemaKeys = schemas[value[0]];
        const schemaLength = schemaKeys.length;
        const total = (value.length - 1) / schemaLength;

        if (total === 0) {
            const object: {[key: string]: JsonValue} = {};

            for (let i = 0, key = schemaKeys[i]; i < schemaLength; key = schemaKeys[i++]) {
                object[key] = decode(value[i]);
            }

            return object;
        }

        // array of objects with same schema
        const collection = [];

        for (let i = 0; i < total; i++) {
            const object: {[key: string]: JsonValue} = {};

            for (let j = 0, key = schemaKeys[j]; j < schemaLength; key = schemaKeys[j++]) {
                object[key] = decode(value[i * schemaLength + j]);
            }

            collection.push(object);
        }

        return collection;
    }

    function decodePrototypeObject(value: JsonObject) : JsonObject {
        const schemaKeys = Object.keys(value).sort();
        const schemaLength = schemaKeys.length;

        if (schemaLength === 0) {
            return {};
        }

        schemas[++maxSchemaIndex] = schemaKeys;

        const object: JsonObject = {};

        for (let i = 0, key = schemaKeys[i]; i < schemaLength; key = schemaKeys[i++]) {
            object[key] = decode(value[key]);
        }

        return object;
    }

    return decode(data);
}

function isPackedObject(value: any) : value is JsonPackedObject {
    return Array.isArray(value) && typeof value[0] === 'number' && value[0] !== 0;
}