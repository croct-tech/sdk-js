import ObjectType from '../validation/objectType';
import StringType from '../validation/stringType';
import NumberType from '../validation/numberType';
import {JsonArrayType, JsonObjectType, JsonType} from '../validation/jsonType';
import UnionType from '../validation/unionType';

const pointer = new StringType({
    pattern: /^([a-zA-Z_]\w*|\[\d+])(\.[a-zA-Z_]\w*|\[\d+])*$/,
});

export const addOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: new JsonType(),
    },
});

export const setOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: new JsonType(),
    },
});

export const combineOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: new JsonType(),
    },
});

export const mergeOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: new UnionType(new JsonArrayType(), new JsonObjectType()),
    },
});

export const decrementOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: new NumberType(),
    },
});

export const incrementOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: new NumberType(),
    },
});

export const clearOperation = new ObjectType({
    required: ['path'],
    properties: {
        path: pointer,
    },
});

export const unsetOperation = new ObjectType({
    required: ['path'],
    properties: {
        path: pointer,
    },
});
