import Logger from '../logger';

export default class NamespacedLogger implements Logger {
    private readonly logger: Logger;

    private readonly namespace: string;

    public constructor(logger: Logger, namespace: string) {
        this.logger = logger;
        this.namespace = namespace;
    }

    public debug(message: string): void {
        this.logger.debug(this.format(message));
    }

    public info(message: string): void {
        this.logger.info(this.format(message));
    }

    public warn(message: string): void {
        this.logger.warn(this.format(message));
    }

    public error(message: string): void {
        this.logger.error(this.format(message));
    }

    private format(message: string): string {
        return `[${this.namespace}] ${message}`;
    }
}
