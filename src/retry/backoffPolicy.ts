import type {RetryPolicy} from './policy';

type Options = {
    minRetryDelay: number, // min retry delay in ms (used in exp. backoff calcs)
    maxRetryDelay: number, // max retry delay in ms (used in exp. backoff calcs)
    backoffFactor: number, // exponential backoff factor (attempts^n)
    backoffJitter: number, // jitter factor for backoff calcs (0 is usually fine)
    maxAttempts: number,
};

export class BackoffPolicy<T> implements RetryPolicy<T> {
    private readonly minRetryDelay: number = 1000;

    private readonly maxRetryDelay: number = 30000;

    private readonly backoffFactor: number = 2;

    private readonly backoffJitter: number = 1;

    private readonly maxAttempts: number = Infinity;

    public constructor(options: Partial<Options> = {}) {
        const {
            minRetryDelay = this.minRetryDelay,
            maxRetryDelay = this.maxRetryDelay,
            backoffFactor = this.backoffFactor,
            backoffJitter = this.backoffJitter,
            maxAttempts = this.maxAttempts,
        } = options;

        if (minRetryDelay < 0) {
            throw new Error('The minimum retry delay must be non-negative.');
        }

        if (maxRetryDelay < minRetryDelay) {
            throw new Error('The maximum retry delay must be greater than the minimum.');
        }

        if (backoffFactor < 1) {
            throw new Error('The backoff factor must be greater than zero.');
        }

        if (backoffJitter < 0) {
            throw new Error('The backoff jitter must be non-negative.');
        }

        if (maxAttempts < 0) {
            throw new Error('The maximum attempts must be non-negative.');
        }

        this.minRetryDelay = minRetryDelay;
        this.maxRetryDelay = maxRetryDelay;
        this.backoffFactor = backoffFactor;
        this.backoffJitter = backoffJitter;
        this.maxAttempts = maxAttempts;
    }

    /**
     * Full Jitter algorithm
     *
     * @see https://www.awsarchitectureblog.com/2015/03/backoff.html
     */
    public getDelay(attempt: number): number {
        let delay = Math.min(Math.max(this.backoffFactor ** attempt, this.minRetryDelay), this.maxRetryDelay);

        if (this.backoffJitter > 0) {
            // Jitter will result in a random value between the minimum and
            // calculated delay for a given attempt.
            const min = Math.ceil(this.minRetryDelay);
            const max = Math.floor(delay);

            delay = Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // Removing any fractional digits
        delay -= delay % 1;

        return delay;
    }

    public shouldRetry(attempt: number): boolean {
        return attempt < this.maxAttempts;
    }
}
