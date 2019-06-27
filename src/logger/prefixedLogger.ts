import {Logger} from '../logger';

export class PrefixedLogger implements Logger {
    private readonly logger: Logger;
    private readonly prefix: string;

    constructor(logger: Logger, prefix: string) {
        this.logger = logger;
        this.prefix = prefix;
    }

    log(message: string, context?: object): void {
        this.logger.log(this.format(message), context);
    }

    error(message: string, context?: object): void {
        this.logger.error(this.format(message), context);
    }

    info(message: string, context?: object): void {
        this.logger.info(this.format(message), context);
    }

    private format(message: string) {
        return `[${this.prefix}] ${message}`;
    }

}