import {isJsonArray, isJsonObject, isJsonValue, JsonArray, JsonObject, JsonValue} from './json';

type OperationType =
    'add' |
    'clear' |
    'combine' |
    'decrement' |
    'increment' |
    'merge' |
    'set' |
    'unset'
;

type BaseOperation<T extends OperationType> = {
    type:  T
    pointer: string
}

type Unset = BaseOperation<'unset'>;

type Clear = BaseOperation<'clear'>;

type Set = BaseOperation<'set'> & {
    value: JsonValue
}

type Add = BaseOperation<'add'> & {
    value: JsonValue
}

type Combine = BaseOperation<'combine'> & {
    value: JsonValue
}

type Merge = BaseOperation<'merge'> & {
    value: JsonArray | JsonObject
}

type Increment = BaseOperation<'increment'> & {
    value: JsonValue
}

type Decrement = BaseOperation<'decrement'> & {
    value: JsonValue
}

export type Operation =
    Unset |
    Clear |
    Add |
    Set |
    Combine |
    Merge |
    Increment |
    Decrement
;

export type Patch = {
    operations: Operation[]
}

export function isValidPointer(path: string) : boolean {
    return /^([a-zA-Z_]\w*|\[\d+])(\.[a-zA-Z_]\w*|\[\d+])*$/.test(path);
}