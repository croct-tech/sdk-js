import {Logger} from '../logger';

export class ConsoleLogger implements Logger {
    log(message: string, context?: object): void {
        console.log(message);
    }

    info(message: string, context?: object): void {
        console.info(message);
    }

    error(message: string, context?: object): void {
        console.error(message);
    }
}