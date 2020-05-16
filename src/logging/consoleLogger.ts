import {Logger} from './index';

type ConsoleMethod = {
    (message?: any, ...optionalParams: any[]): void,
}

export default class ConsoleLogger implements Logger {
    private readonly namespace?: string;

    public constructor(namespace?: string) {
        this.namespace = namespace;
    }

    public get debug(): (message: string) => void {
        return this.bind(window.console.debug);
    }

    public get info(): (message: string) => void {
        return this.bind(window.console.info);
    }

    public get warn(): (message: string) => void {
        return this.bind(window.console.warn);
    }

    public get error(): (message: string) => void {
        return this.bind(window.console.error);
    }

    private bind(method: ConsoleMethod): ConsoleMethod {
        if (this.namespace !== undefined) {
            return method.bind(window.console, `[${this.namespace}]`);
        }

        return method.bind(window.console);
    }
}
