import {Container} from './container';
import {configurationSchema} from './schemas';
import Tracker from './tracker';
import {TokenScope} from './context';
import {isValidPointer, Operation, Patch} from './patch';
import {isJsonArray, isJsonObject, isJsonValue} from './json';
import {Token} from './token';

class Sdk {
    private installation: Container;

    get tracker() : TrackerFacade {
        return new TrackerFacade(this.container.getTracker());
    }

    get user() : UserFacade {
        return new UserFacade(this.container.getTracker());
    }

    get session() : SessionFacade {
        return new SessionFacade(this.container.getTracker());
    }

    private get container(): Container {
        if (!this.installation) {
            throw new Error('Croct SDK is not enabled');
        }

        return this.installation;
    }

    enable(configuration: Configuration): void {
        if (this.installation) {
            throw new Error('The SDK is already installed');
        }

        configurationSchema.validate(configuration);

        const {track = true, ...containerConfiguration} = configuration;

        this.installation = new Container({
            storageNamespace: 'croct',
            tokenScope: 'global',
            debug: false,
            ...containerConfiguration,
            beaconVersion: '<@beaconVersion@>',
            websocketEndpoint: '<@websocketEndpoint@>',
            evaluationEndpoint: '<@evaluationEndpoint@>'
        });

        const logger = this.container.getLogger();
        const {apiKey, tokenScope} = this.container.getConfiguration();

        logger.info('Croct SDK enabled');
        logger.info(`API Key: ${apiKey}`);

        const context = this.container.getContext();
        const tab = context.getTab();

        logger.info('Context initialized');
        logger.log(`Token scope: ${tokenScope}`);
        logger.log(`${tab.isNew ? 'New' : 'Current'} tab: ${tab.id}`);

        if (track) {
            this.tracker.enable();
        }
    }

    disable(): void {
        const logger = this.container.getLogger();

        this.container.destroy();

        delete this.installation;

        logger.info('Croct SDK disabled');
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

    evaluate(expression: any, timeout?: any): Promise<any> {
        if (typeof expression !== 'string' || expression.length === 0) {
            throw new Error('The expression must be a non-empty string.');
        }

        if (timeout !== undefined && (typeof timeout !== 'number' || timeout <= 0)) {
            throw new Error('The timeout must be a number greater than 0.');
        }

        const {apiKey, evaluationEndpoint} = this.container.getConfiguration();

        return new Promise<any>((resolve, reject) => {
            const promise = window.fetch(`${evaluationEndpoint}?expression=${encodeURIComponent(expression)}`, {
                headers: {
                    'Api-Key': apiKey
                }
            });

            promise
                .then(async response => {
                    if (timeout !== undefined) {
                        window.setTimeout(() => {
                            reject(new Error('Maximum timeout exceeded before evaluation could complete.'));
                        }, timeout);
                    }

                    if (!response.ok) {
                        reject(new Error(response.statusText));

                        return;
                    }

                    response.json().then(data => {
                        if (data.error) {
                            reject(new Error(data.error));

                            return;
                        }

                        resolve(data.result);
                    });
                })
                .catch(reason => reject(reason));
        });
    }
}

type Configuration = {
    apiKey: string;
    storageNamespace?: string;
    tokenScope?: TokenScope;
    track?: boolean;
    debug?: boolean;
}

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
    private readonly tracker: Tracker;

    constructor(tracker: Tracker) {
        super();

        this.tracker = tracker;
    }

    isLogged(): boolean {
        return this.tracker.hasToken();
    }

    getToken(): Token | null {
        return this.tracker.getToken();
    }

    login(userId: any): void {
        if (typeof userId !== 'string' || userId === '') {
            throw new Error('The user ID must be a non-empty string.');
        }

        this.tracker.login(userId);
    }

    logout(): void {
        this.tracker.logout();
    }

    save(): void {
        if (this.isDirty()) {
            this.tracker.track({
                type: 'userProfileChanged',
                patch: this.buildPath(),
            });

            this.reset();
        }
    }
}

class SessionFacade extends ActiveRecord {
    private readonly tracker: Tracker;

    constructor(tracker: Tracker) {
        super();

        this.tracker = tracker;
    }

    save(): void {
        if (this.isDirty()) {
            this.tracker.track({
                type: 'sessionAttributesChanged',
                patch: this.buildPath(),
            });

            this.reset();
        }
    }
}

class TrackerFacade {
    private readonly tracker: Tracker;

    constructor(tracker: Tracker) {
        this.tracker = tracker;
    }

    enable(): void {
        this.tracker.enable();
    }

    disable(): void {
        this.tracker.disable();
    }
}

type TargetCallback = {
    (target: ElementMap): void
};

type PersonalizationCallback = {
    (target: ElementMap, result: any): void
};

type Evaluator = {
    (expression: any, timeout?: any): Promise<any>
}

type ElementMap = {[key: string]: HTMLElement};

class PersonalizationBuilder {
    private readonly expression: string;
    private readonly evaluator: Evaluator;
    private readonly timeout?: number;
    private readonly elements: ElementMap = {};
    private beforeCallback: TargetCallback;
    private afterCallback: TargetCallback;

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

    hideBefore() : PersonalizationBuilder {
        const visibilities: { [key: string]: string | null } = {};

        this.before(elements => {
            for (const [key, element] of Object.entries(elements)) {
                visibilities[key] = element.style.visibility;
                element.style.visibility = 'hidden';
            }
        });

        this.after(() => {
            for (const [key, element] of Object.entries(this.elements)) {
                element.style.visibility = visibilities[key];
            }
        });

        return this;
    }

    before(callback: TargetCallback) : PersonalizationBuilder {
        this.beforeCallback = callback;

        return this;
    }

    after(callback: TargetCallback) : PersonalizationBuilder {
        this.afterCallback = callback;

        return this;
    }

    apply(onFulfilled: PersonalizationCallback, onFailed?: PersonalizationCallback): Promise<any> {
        if (typeof onFulfilled !== 'function') {
            throw new Error('The fulfilled callback must be a function.');
        }

        if (onFailed !== undefined && typeof onFailed !== 'function') {
            throw new Error('The failure callback must be a function.');
        }

        if (this.beforeCallback) {
            this.beforeCallback({...this.elements});
        }

        const promise = this.evaluator(this.expression, this.timeout);

        promise.then(result => onFulfilled(this.elements, result), () => {});

        if (onFailed !== undefined) {
            promise.catch(reason => onFailed(this.elements, reason));
        }

        promise
            .finally(() => {
                if (this.afterCallback) {
                    this.afterCallback({...this.elements});
                }
            })
            .catch(() => {});

        return promise;
    }
}

export default new Sdk();