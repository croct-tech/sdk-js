import {RetryPolicy} from './index';

export default class MaxAttemptsPolicy<T> implements RetryPolicy<T> {
    private readonly maxAttempts: number;

    private readonly delay: number;

    public constructor(delay: number, maxAttempts: number) {
        if (delay < 0) {
            throw new Error('Delay must be non-negative.');
        }

        if (maxAttempts < 0) {
            throw new Error('Max attempts must be non-negative.');
        }

        this.maxAttempts = maxAttempts;
        this.delay = delay;
    }

    public getDelay(): number {
        return this.delay;
    }

    public shouldRetry(attempt: number): boolean {
        return attempt < this.maxAttempts;
    }
}
