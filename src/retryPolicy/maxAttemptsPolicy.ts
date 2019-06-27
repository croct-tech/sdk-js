import {RetryPolicy} from '../retryPolicy';

export class MaxAttemptsPolicy<T> implements RetryPolicy<T> {
    private readonly maxAttempts: number;
    private readonly delay: number;

    constructor(delay: number, maxAttempts: number) {
        if (delay < 0) {
            throw new Error('Delay must be non-negative');
        }

        if (maxAttempts < 0) {
            throw new Error('Max attempts must be non-negative');
        }

        this.maxAttempts = maxAttempts;
        this.delay = delay;
    }

    getDelay(attempt: number): number {
        return this.delay;
    }

    shouldRetry(attempt: number, subject?: T, failure?: any): boolean {
        return attempt < this.maxAttempts;
    }
}