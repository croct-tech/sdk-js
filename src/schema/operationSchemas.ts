import {
    ObjectType,
    StringType,
    NumberType,
    JsonArrayType,
    JsonObjectType,
    JsonPrimitiveType,
    UnionType,
} from '../validation';

const pointer = new StringType({
    format: 'pointer',
});

const simpleArray = new JsonArrayType({
    items: new JsonPrimitiveType(),
});

const simpleMap = new JsonObjectType({
    properties: new JsonPrimitiveType(),
});

const complexMap = new JsonObjectType({
    properties: new UnionType(new JsonPrimitiveType(), simpleArray, simpleMap),
});

const collectionValue = new UnionType(simpleArray, complexMap);

const mixedValue = new UnionType(new JsonPrimitiveType(), simpleArray, complexMap);

export const addOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: mixedValue,
    },
});

export const setOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: mixedValue,
    },
});

export const combineOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: mixedValue,
    },
});

export const mergeOperation = new ObjectType({
    required: ['path', 'value'],
    properties: {
        path: pointer,
        value: collectionValue,
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
