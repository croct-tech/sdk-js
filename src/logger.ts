export interface Logger {
    log(message: string, context?: object): void;
    error(message: string, context?: object): void;
    info(message: string, context?: object): void;
}