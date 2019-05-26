import {Operation, Patch} from './patch';
import {JsonArray, JsonObject, JsonValue} from './json';
import {Event} from './event';
import {
    addOperation,
    clearOperation,
    combineOperation,
    decrementOperation,
    incrementOperation,
    mergeOperation,
    setOperation,
    unsetOperation,
} from './schema/operationSchemas';

const operationSchema = {
    add: addOperation,
    set: setOperation,
    merge: mergeOperation,
    combine: combineOperation,
    increment: incrementOperation,
    decrement: decrementOperation,
    clear: clearOperation,
    unset: unsetOperation,
};

export default abstract class ActiveRecord<T extends Event> {
    private readonly operations: Operation[] = [];

    public set(property: string, value: JsonValue): this {
        return this.pushOperation({
            type: 'set',
            path: property,
            value: value,
        });
    }

    public add(property: string, value: JsonValue): this {
        return this.pushOperation({
            type: 'add',
            path: property,
            value: value,
        });
    }

    public combine(property: string, value: JsonValue): this {
        return this.pushOperation({
            type: 'combine',
            path: property,
            value: value,
        });
    }

    public merge(property: string, value: JsonObject | JsonArray): this {
        return this.pushOperation({
            type: 'merge',
            path: property,
            value: value,
        });
    }

    public increment(property: string, amount = 1): this {
        return this.pushOperation({
            type: 'increment',
            path: property,
            value: amount,
        });
    }

    public decrement(property: string, amount = 1): this {
        return this.pushOperation({
            type: 'decrement',
            path: property,
            value: amount,
        });
    }

    public clear(property: string): this {
        return this.pushOperation({
            type: 'clear',
            path: property,
        });
    }

    public unset(property: string): this {
        return this.pushOperation({
            type: 'unset',
            path: property,
        });
    }

    private pushOperation(operation: Operation): this {
        const {type, ...data} = operation;

        operationSchema[type].validate(data);

        this.operations.push(operation);

        return this;
    }

    public reset(): this {
        this.operations.splice(0);

        return this;
    }

    public abstract save(): Promise<T>;

    protected isDirty(): boolean {
        return this.operations.length > 0;
    }

    protected buildPatch(): Patch {
        return {operations: this.operations.slice()};
    }
}
