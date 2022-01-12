import {Operation, Patch} from './patch';
import {JsonArray, JsonObject, JsonValue} from './json';
import {TrackingEvent} from './trackingEvents';
import {
    addOperation,
    clearOperation,
    combineOperation,
    decrementOperation,
    incrementOperation,
    mergeOperation,
    setOperation,
    unsetOperation,
    removeOperation,
} from './schema';

const operationSchema = {
    add: addOperation,
    set: setOperation,
    merge: mergeOperation,
    combine: combineOperation,
    increment: incrementOperation,
    decrement: decrementOperation,
    clear: clearOperation,
    unset: unsetOperation,
    remove: removeOperation,
};

export abstract class ActiveRecord<T extends TrackingEvent> {
    private readonly operations: Operation[] = [];

    public set(value: JsonValue): this;

    public set(property: string, value: JsonValue): this;

    public set(propertyOrValue: string | JsonValue, value?: JsonValue): this {
        if (typeof propertyOrValue === 'string') {
            return this.pushOperation({
                type: 'set',
                path: propertyOrValue,
                value: value as JsonValue,
            });
        }

        return this.pushOperation({
            type: 'set',
            path: '.',
            value: propertyOrValue,
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

    public merge(value: JsonObject | JsonArray): this;

    public merge(property: string, value: JsonObject | JsonArray): this;

    public merge(propertyOrValue: string | JsonObject | JsonArray, value?: JsonObject | JsonArray): this {
        if (typeof propertyOrValue === 'string') {
            return this.pushOperation({
                type: 'merge',
                path: propertyOrValue,
                value: value as JsonObject | JsonArray,
            });
        }

        return this.pushOperation({
            type: 'merge',
            path: '.',
            value: propertyOrValue,
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

    public remove(property: string, value: JsonValue): this {
        return this.pushOperation({
            type: 'remove',
            path: property,
            value: value,
        });
    }

    private pushOperation(operation: Operation): this {
        const {type, ...data} = operation;

        operationSchema[type].validate(data);

        this.operations.push(operation);

        return this;
    }

    protected reset(): this {
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
