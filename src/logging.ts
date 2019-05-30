interface Logger {
    log(message: string, context?: object): void;
    error(message: string, context?: object): void;
    info(message: string, context?: object): void;
}

class ConsoleLogger implements Logger{
    log(message: string, context?: object): void {
        console.log.apply(null, arguments);
    }

    info(message: string, context?: object): void {
        console.info.apply(null, arguments);
    }

    error(message: string, context?: object): void {
        console.error.apply(null, arguments);
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