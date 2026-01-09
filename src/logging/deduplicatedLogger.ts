import {Logger} from './logger';

export class DeduplicatedLogger implements Logger {
    private readonly logger: Logger;

    private readonly recentMessages = new Set<string>();

    private readonly maxSize: number;

    public constructor(logger: Logger, maxSize: number = 100) {
        this.logger = logger;
        this.maxSize = maxSize;
    }

    public debug(message: string): void {
        if (this.isDuplicated(message)) {
            this.logger.debug(message);
        }
    }

    public info(message: string): void {
        if (this.isDuplicated(message)) {
            this.logger.info(message);
        }
    }

    public warn(message: string): void {
        if (this.isDuplicated(message)) {
            this.logger.warn(message);
        }
    }

    public error(message: string): void {
        if (this.isDuplicated(message)) {
            this.logger.error(message);
        }
    }

    private isDuplicated(message: string): boolean {
        if (this.recentMessages.has(message)) {
            // Move to end (most recent)
            this.recentMessages.delete(message);
            this.recentMessages.add(message);

            return false;
        }

        // Evict oldest if at capacity
        if (this.recentMessages.size >= this.maxSize) {
            const oldest = this.recentMessages.values().next().value;

            this.recentMessages.delete(oldest);
        }

        this.recentMessages.add(message);

        return true;
    }
}
