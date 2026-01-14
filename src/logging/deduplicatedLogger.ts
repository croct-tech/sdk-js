import {Logger} from './logger';

type Level = 'debug' | 'info' | 'warn' | 'error';

export class DeduplicatedLogger implements Logger {
    private readonly logger: Logger;

    private readonly recentMessages = new Set<string>();

    private readonly maxSize: number;

    public constructor(logger: Logger, maxSize: number = 100) {
        this.logger = logger;
        this.maxSize = maxSize;

        if (maxSize <= 0 || !Number.isInteger(maxSize)) {
            throw new Error('maxSize must be greater than 0');
        }
    }

    public debug(message: string): void {
        if (this.isDuplicated('debug', message)) {
            this.logger.debug(message);
        }
    }

    public info(message: string): void {
        if (this.isDuplicated('info', message)) {
            this.logger.info(message);
        }
    }

    public warn(message: string): void {
        if (this.isDuplicated('warn', message)) {
            this.logger.warn(message);
        }
    }

    public error(message: string): void {
        if (this.isDuplicated('error', message)) {
            this.logger.error(message);
        }
    }

    private isDuplicated(level: Level, message: string): boolean {
        const key = `${level}:${message}`;

        if (this.recentMessages.has(key)) {
            // Move to end (most recent)
            this.recentMessages.delete(key);
            this.recentMessages.add(key);

            return false;
        }

        // Evict oldest if at capacity
        if (this.recentMessages.size >= this.maxSize) {
            const oldest = this.recentMessages.values().next().value;

            this.recentMessages.delete(oldest);
        }

        this.recentMessages.add(key);

        return true;
    }
}
