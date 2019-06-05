interface Logger {
    log(message: string, context?: object): void;
    error(message: string, context?: object): void;
    info(message: string, context?: object): void;
}

class ConsoleLogger implements Logger {
    log(message: string, context?: object): void {
        if (!context) {
            console.log(message);

            return;
        }

        console.log(message, context);
    }

    info(message: string, context?: object): void {
        if (!context) {
            console.info(message);

            return;
        }

        console.info(message, context);
    }

    error(message: string, context?: object): void {
        if (!context) {
            console.error(message);

            return;
        }

        console.error(message, context);
    }
}

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

class NullLogger implements Logger {
    log(): void {
    }

    info(): void {
    }

    error(): void {
    }
}

export {Logger, ConsoleLogger, NullLogger};