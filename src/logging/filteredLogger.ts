import type {Logger} from './logger';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFilter = (level: LogLevel, message: string) => boolean;

export type FilteredLoggerConfiguration = {
    logger: Logger,
    allowFilter: LogFilter,
};

export class FilteredLogger implements Logger {
    private readonly logger: Logger;

    private readonly allowFilter: LogFilter;

    public constructor(configuration: FilteredLoggerConfiguration) {
        this.logger = configuration.logger;
        this.allowFilter = configuration.allowFilter;
    }

    public static include(logger: Logger, levels: LogLevel[]): Logger {
        return new FilteredLogger({
            logger: logger,
            allowFilter: (level: LogLevel): boolean => levels.includes(level),
        });
    }

    public static exclude(logger: Logger, levels: LogLevel[]): FilteredLogger {
        return new FilteredLogger({
            logger: logger,
            allowFilter: (level: LogLevel): boolean => !levels.includes(level),
        });
    }

    public debug(message: string): void {
        this.log('debug', message);
    }

    public info(message: string): void {
        this.log('info', message);
    }

    public warn(message: string): void {
        this.log('warn', message);
    }

    public error(message: string): void {
        this.log('error', message);
    }

    private log(level: LogLevel, message: string): void {
        if (this.allowFilter(level, message)) {
            this.logger[level](message);
        }
    }
}
