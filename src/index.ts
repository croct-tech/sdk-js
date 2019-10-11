import Sdk from './sdk';
import {Token} from './token';
import {isValidPointer, Operation, Patch} from './patch';
import {isJsonArray, isJsonObject, isJsonValue} from './json';
import validateConfig from '../validation/configuration';
import productViewedValidator from '../validation/product-viewed';
import cartModifiedValidator from '../validation/cart-modified';
import cartViewedValidator from '../validation/cart-viewed';
import checkoutStartedValidator from '../validation/checkout-started';
import orderPlacedValidator from '../validation/order-placed';
import userSignedUpValidator from '../validation/user-signed-up';
import {ValidateFunction} from 'ajv';
import {formatError} from './validation';
import {CustomPayloadType} from './beacon';

class PatchBuilder {
    private readonly operations: Operation[] = [];

    constructor() {
        this.set = this.set.bind(this);
        this.unset = this.unset.bind(this);
        this.add = this.add.bind(this);
        this.combine = this.combine.bind(this);
        this.decrement = this.decrement.bind(this);
        this.increment = this.increment.bind(this);
        this.merge = this.merge.bind(this);
        this.clear = this.clear.bind(this);
    }

    set(property: any, value: any) : void {
        if (typeof property !== 'string'|| !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (!isJsonValue(value)) {
            throw new Error('The value must be a valid JSON value.');
        }

        this.operations.push({
            type: 'set',
            pointer: property,
            value: value
        });
    }

    add(property: any, value: any) : void {
        if (typeof property !== 'string'|| !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (!isJsonValue(value)) {
            throw new Error('The value must be a valid JSON value.');
        }

        this.operations.push({
            type: 'add',
            pointer: property,
            value: value
        });
    }

    combine(property: any, value: any) : void {
        if (typeof property !== 'string'|| !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (!isJsonValue(value)) {
            throw new Error('The value must be a valid JSON value.');
        }

        this.operations.push({
            type: 'combine',
            pointer: property,
            value: value
        });
    }

    merge(property: any, value: any) : void {
        if (typeof property !== 'string'|| !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (!isJsonArray(value) && !isJsonObject(value)) {
            throw new Error('The value must be a valid JSON array or object.');
        }

        this.operations.push({
            type: 'merge',
            pointer: property,
            value: value
        });
    }

    increment(property: any, amount: any = 1) : void {
        if (typeof property !== 'string'|| !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (typeof amount !== 'number') {
            throw new Error('The amount must be of type number.');
        }

        this.operations.push({
            type: 'increment',
            pointer: property,
            value: amount
        });
    }

    decrement(property: any, amount: any = 1) : void {
        if (typeof property !== 'string'|| !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (typeof amount !== 'number') {
            throw new Error('The amount must be of type number.');
        }

        this.operations.push({
            type: 'decrement',
            pointer: property,
            value: amount
        });
    }

    clear(property: any) : void {
        if (typeof property !== 'string'|| !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        this.operations.push({
            type: 'clear',
            pointer: property,
        });
    }

    unset(property: any) : void {
        if (typeof property !== 'string'|| !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        this.operations.push({
            type: 'unset',
            pointer: property,
        });
    }

    isEmpty() : boolean {
        return this.operations.length === 0;
    }

    reset() : void {
        this.operations.slice(0);
    }

    build(): Patch {
        return {
            operations: this.operations.slice(0),
        }
    }
}

const userPatch = new PatchBuilder();
const sessionPatch = new PatchBuilder();
const payloadValidators : {[key in CustomPayloadType]: ValidateFunction} = {
    productViewed: productViewedValidator,
    cartModified: cartModifiedValidator,
    cartViewed: cartViewedValidator,
    checkoutStarted: checkoutStartedValidator,
    orderPlaced: orderPlacedValidator,
    userSignedUp: userSignedUpValidator,
};

export default {
    enable(options: any = {}): void {
        if (!validateConfig(options) && validateConfig.errors) {
            throw new Error(formatError(validateConfig.errors[0]));
        }

        const {track = true, ...sdkOptions} = options;

        Sdk.install(sdkOptions);

        if (track) {
            Sdk.tracker.enable();
        }
    },
    disable(): void {
        Sdk.uninstall();
        userPatch.reset();
        sessionPatch.reset();
    },
    track(eventType: any, payload: any) : void {
        if (typeof eventType !== 'string' || eventType.length === 0) {
            throw new Error('The event type must be a non-empty string.');
        }

        if (payload === null || typeof payload !== 'object') {
            throw new Error('The event payload must be an a map of key-value pairs.');
        }

        const validator = payloadValidators[eventType as CustomPayloadType];

        if (validator === undefined) {
            throw new Error(`Unknown event type '${eventType}'.`);
        }

        if (!validator(payload) && validator.errors) {
            throw new Error(formatError(validator.errors[0]));
        }

        Sdk.tracker.track({
            type: eventType,
            ...payload
        });
    },
    tracker: {
        enable(): void {
            Sdk.tracker.enable();
        },

        disable(): void {
            Sdk.tracker.disable();
        },
    },
    user: {
        isLogged: (): boolean => {
            return Sdk.tracker.hasToken();
        },

        getToken: (): Token | null => {
            return Sdk.tracker.getToken();
        },

        login(userId: any): void {
            if (typeof userId !== 'string' || userId === '') {
                throw new Error('The user ID must be a non-empty string.');
            }

            Sdk.tracker.login(userId);
        },

        logout(): void {
            Sdk.tracker.logout();
        },

        set: userPatch.set,
        unset: userPatch.unset,
        add: userPatch.add,
        combine: userPatch.combine,
        decrement: userPatch.decrement,
        increment: userPatch.increment,
        merge: userPatch.merge,
        clear: userPatch.clear,

        save() : void {
            if (userPatch.isEmpty()) {
                return;
            }

            Sdk.tracker.track({
                type: 'userProfileChanged',
                patch: userPatch.build(),
            });

            userPatch.reset();
        }
    },
    session: {
        set: sessionPatch.set,
        unset: sessionPatch.unset,
        add: sessionPatch.add,
        combine: sessionPatch.combine,
        decrement: sessionPatch.decrement,
        increment: sessionPatch.increment,
        merge: sessionPatch.merge,
        clear: sessionPatch.clear,

        save() : void {
            if (sessionPatch.isEmpty()) {
                return;
            }

            Sdk.tracker.track({
                type: 'sessionAttributesChanged',
                patch: sessionPatch.build(),
            });

            sessionPatch.reset();
        }
    }
};