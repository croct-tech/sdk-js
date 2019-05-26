import {JsonArray, JsonObject, JsonValue} from './json';

interface AbstractOperation {
    type: string;
    path: string;
}

interface UnsetOperation extends AbstractOperation {
    type: 'unset';
}

interface ClearOperation extends AbstractOperation {
    type: 'clear';
}

interface SetOperation extends AbstractOperation {
    type: 'set';
    value: JsonValue;
}

interface AddOperation extends AbstractOperation {
    type: 'add';
    value: JsonValue;
}

interface CombineOperation extends AbstractOperation {
    type: 'combine';
    value: JsonValue;
}

interface MergeOperation extends AbstractOperation {
    type: 'merge';
    value: JsonArray | JsonObject;
}

interface IncrementOperation extends AbstractOperation {
    type: 'increment';
    value: JsonValue;
}

interface DecrementOperation extends AbstractOperation {
    type: 'decrement';
    value: JsonValue;
}

export type Operation =
      UnsetOperation
    | ClearOperation
    | AddOperation
    | SetOperation
    | CombineOperation
    | MergeOperation
    | IncrementOperation
    | DecrementOperation;

export interface Patch {
    operations: Operation[];
}
