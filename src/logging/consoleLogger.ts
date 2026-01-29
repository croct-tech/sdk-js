/* eslint-disable no-console -- This is a logging utility */
import type {Logger} from './logger';

type ConsoleMethod = {
    (message?: any, ...optionalParams: any[]): void,
};

export class ConsoleLogger implements Logger {
    private readonly namespace?: string;

    public constructor(namespace?: string) {
        this.namespace = namespace;
    }

    public get debug(): (message: string) => void {
        return this.bind(console.debug);
    }

    public get info(): (message: string) => void {
        return this.bind(console.info);
    }

    public get warn(): (message: string) => void {
        return this.bind(console.warn);
    }

    public get error(): (message: string) => void {
        return this.bind(console.error);
    }

    private bind(method: ConsoleMethod): ConsoleMethod {
        if (this.namespace !== undefined) {
            return method.bind(console, `[${this.namespace}]`);
        }

        return method.bind(console);
    }
}
