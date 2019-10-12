import Sdk from './sdk';
import {Token} from './token';
import {isValidPointer, Operation, Patch} from './patch';
import {configurationSchema, payloadSchemas} from './schemas';
import {isJsonArray, isJsonObject, isJsonValue} from './json';

class ActiveRecord {
    private readonly operations: Operation[] = [];

    set(property: any, value: any): void {
        if (typeof property !== 'string' || !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (!isJsonValue(value)) {
            throw new Error('The value must be a valid JSON value.');
        }

        this.operations.push({
            type: 'set',
            pointer: property,
            value: value,
        });
    }

    add(property: any, value: any): void {
        if (typeof property !== 'string' || !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (!isJsonValue(value)) {
            throw new Error('The value must be a valid JSON value.');
        }

        this.operations.push({
            type: 'add',
            pointer: property,
            value: value,
        });
    }

    combine(property: any, value: any): void {
        if (typeof property !== 'string' || !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (!isJsonValue(value)) {
            throw new Error('The value must be a valid JSON value.');
        }

        this.operations.push({
            type: 'combine',
            pointer: property,
            value: value,
        });
    }

    merge(property: any, value: any): void {
        if (typeof property !== 'string' || !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (!isJsonArray(value) && !isJsonObject(value)) {
            throw new Error('The value must be a valid JSON array or object.');
        }

        this.operations.push({
            type: 'merge',
            pointer: property,
            value: value,
        });
    }

    increment(property: any, amount: any = 1): void {
        if (typeof property !== 'string' || !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (typeof amount !== 'number') {
            throw new Error('The amount must be of type number.');
        }

        this.operations.push({
            type: 'increment',
            pointer: property,
            value: amount,
        });
    }

    decrement(property: any, amount: any = 1): void {
        if (typeof property !== 'string' || !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        if (typeof amount !== 'number') {
            throw new Error('The amount must be of type number.');
        }

        this.operations.push({
            type: 'decrement',
            pointer: property,
            value: amount,
        });
    }

    clear(property: any): void {
        if (typeof property !== 'string' || !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        this.operations.push({
            type: 'clear',
            pointer: property,
        });
    }

    unset(property: any): void {
        if (typeof property !== 'string' || !isValidPointer(property)) {
            throw new Error(`Invalid path '${property}'.`);
        }

        this.operations.push({
            type: 'unset',
            pointer: property,
        });
    }

    public reset(): void {
        this.operations.splice(0);
    }

    protected isDirty(): boolean {
        return this.operations.length > 0;
    }

    protected buildPath(): Patch {
        return {operations: this.operations};
    }
}

class UserFacade extends ActiveRecord {
    isLogged(): boolean {
        return Sdk.tracker.hasToken();
    }

    getToken(): Token | null {
        return Sdk.tracker.getToken();
    }

    login(userId: any): void {
        if (typeof userId !== 'string' || userId === '') {
            throw new Error('The user ID must be a non-empty string.');
        }

        Sdk.tracker.login(userId);
    }

    logout(): void {
        Sdk.tracker.logout();
    }

    save(): void {
        if (this.isDirty()) {
            Sdk.tracker.track({
                type: 'userProfileChanged',
                patch: this.buildPath(),
            });

            this.reset();
        }
    }
}

class SessionFacade extends ActiveRecord {
    save(): void {
        if (this.isDirty()) {
            Sdk.tracker.track({
                type: 'sessionAttributesChanged',
                patch: this.buildPath(),
            });

            this.reset();
        }
    }
}

class TrackerFacade {
    enable(): void {
        Sdk.tracker.enable();
    }

    disable(): void {
        Sdk.tracker.disable();
    }
}

type PersonalizationCallback = {
    (target: HTMLElement | { [key: string]: HTMLElement }, result: any): void
};

type Evaluator = {
    (expression: any, timeout?: any): Promise<any>
};

class PersonalizationBuilder {
    private readonly expression: string;
    private readonly evaluator: Evaluator;
    private readonly timeout?: number;
    private readonly elements: { [key: string]: HTMLElement } = {};

    constructor(expression: string, evaluator: Evaluator, timeout?: number) {
        this.expression = expression;
        this.evaluator = evaluator;
        this.timeout = timeout;
    }

    select(key: any, selector?: any): PersonalizationBuilder {
        if (typeof key === 'object' && selector === undefined) {
            for (const entry of Object.entries(key)) {
                this.select(...entry);
            }

            return this;
        }

        if (typeof key !== 'string' || key.length === 0) {
            throw new Error('The key must be a non-empty string.');
        }

        if (typeof selector !== 'string' || selector.length === 0) {
            throw new Error('The selector must be a non-empty string.');
        }

        const element: HTMLElement | null = document.querySelector(selector);

        if (element !== null) {
            this.elements[key] = element;
        }

        return this;
    }

    apply(onFulfilled: PersonalizationCallback, onFailed?: PersonalizationCallback): PersonalizationBuilder {
        if (typeof onFulfilled !== 'function') {
            throw new Error('The fulfilled callback must be a function.');
        }

        if (onFailed !== undefined && typeof onFailed !== 'function') {
            throw new Error('The failure callback must be a function.');
        }

        const visibilities: { [key: string]: string | null } = {};

        for (const [key, element] of Object.entries(this.elements)) {
            visibilities[key] = element.style.visibility;
            element.style.visibility = 'hidden';
        }

        const promise = this.evaluator(this.expression, this.timeout);

        promise.then(result => onFulfilled(this.elements, result), () => {});

        if (onFailed !== undefined) {
            promise.catch(reason => onFailed(this.elements, reason));
        }

        promise
            .finally(() => {
                for (const [key, element] of Object.entries(this.elements)) {
                    element.style.visibility = visibilities[key];
                }
            })
            .catch(() => {});

        return this;
    }
}

class SdkFacade {
    public readonly user: UserFacade = new UserFacade();
    public readonly session: SessionFacade = new SessionFacade();
    public readonly tracker = new TrackerFacade();

    enable(configuration: any = {}): void {
        configurationSchema.validate(configuration);

        const {track = true, ...sdkOptions} = configuration;

        Sdk.install(sdkOptions);

        if (track) {
            Sdk.tracker.enable();
        }
    }

    disable(): void {
        Sdk.uninstall();

        this.user.reset();
        this.session.reset();
    }

    track(eventType: any, payload: any): void {
        if (typeof eventType !== 'string' || eventType.length === 0) {
            throw new Error('The event type must be a non-empty string.');
        }

        if (payload === null || typeof payload !== 'object') {
            throw new Error('The event payload must be an a map of key-value pairs.');
        }

        const schema = payloadSchemas[eventType];

        if (schema === undefined) {
            throw new Error(`Unknown event type '${eventType}'.`);
        }

        schema.validate(payload);

        Sdk.tracker.track({
            type: eventType,
            ...payload,
        });
    }

    evaluate(expression: any, timeout?: any): Promise<any> {
        if (typeof expression !== 'string' || expression.length === 0) {
            throw new Error('The expression must be a non-empty string.');
        }

        if (timeout !== undefined && (typeof timeout !== 'number' || timeout <= 0)) {
            throw new Error('The timeout must be a number greater than 0.');
        }

        return new Promise<any>((resolve, reject) => {
            const promise = Sdk.evaluate(expression);

            let timer: number;

            promise
                .then(async response => {
                    if (!response.ok) {
                        reject(new Error(response.statusText));

                        return;
                    }

                    window.clearTimeout(timer);

                    const data = await response.json();

                    if (data.error) {
                        reject(new Error(data.error));

                        return;
                    }

                    resolve(data.result);
                })
                .catch(reason => {
                    window.clearTimeout(timer);
                    reject(reason);
                });

            if (timeout !== undefined) {
                timer = window.setTimeout(
                    () => reject(new Error('Maximum timeout exceeded before evaluation could complete.')),
                    timeout,
                );
            }
        });
    }

    personalize(expression: any, timeout: any = 300): PersonalizationBuilder {
        if (typeof expression !== 'string' || expression.length === 0) {
            throw new Error('The expression must be a non-empty string.');
        }

        if (typeof timeout !== 'number' || timeout <= 0) {
            throw new Error('The timeout must be a number greater than 0.');
        }

        return new PersonalizationBuilder(expression, this.evaluate.bind(this), timeout);
    }
}

export default new SdkFacade();