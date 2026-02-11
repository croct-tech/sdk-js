import type {JsonStructure, JsonValue} from '@croct/json';

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
    value: JsonStructure;
}

interface IncrementOperation extends AbstractOperation {
    type: 'increment';
    value: JsonValue;
}

interface DecrementOperation extends AbstractOperation {
    type: 'decrement';
    value: JsonValue;
}

interface removeOperation extends AbstractOperation {
    type: 'remove';
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
    | DecrementOperation
    | removeOperation;

export interface Patch {
    operations: Operation[];
}
