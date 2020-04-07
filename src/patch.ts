import {LenientJsonArray, LenientJsonObject, LenientJsonValue} from './json';

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
    value: LenientJsonValue;
}

interface AddOperation extends AbstractOperation {
    type: 'add';
    value: LenientJsonValue;
}

interface CombineOperation extends AbstractOperation {
    type: 'combine';
    value: LenientJsonValue;
}

interface MergeOperation extends AbstractOperation {
    type: 'merge';
    value: LenientJsonArray | LenientJsonObject;
}

interface IncrementOperation extends AbstractOperation {
    type: 'increment';
    value: LenientJsonValue;
}

interface DecrementOperation extends AbstractOperation {
    type: 'decrement';
    value: LenientJsonValue;
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
