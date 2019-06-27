export interface RetryPolicy<T> {
    shouldRetry(attempt: number, subject?: T, failure?: any): boolean;
    getDelay(attempt: number): number;
}

