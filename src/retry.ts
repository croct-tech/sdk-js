export interface RetryPolicy<T> {
    shouldRetry(beacon: T, attempt: number, error: Error) : boolean;
    getDelay(attempt: number) : number;
}

export class FixedRetryPolicy<T> implements RetryPolicy<T> {
    private readonly maxAttempts: number;
    private readonly delay: number;

    constructor(delay: number, maxAttempts: number = Infinity) {
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

    shouldRetry(beacon: T, attempt: number, error: Error): boolean {
        return attempt < this.maxAttempts;
    }
}

type BackoffPolicyOptions = {
    minRetryDelay: number,  // min retry delay in ms (used in exp. backoff calcs)
    maxRetryDelay: number,  // max retry delay in ms (used in exp. backoff calcs)
    backoffFactor: number,  // exponential backoff factor (attempts^n)
    backoffJitter: number,  // jitter factor for backoff calcs (0 is usually fine)
    maxAttempts: number,
}

export class BackoffPolicy<T> implements RetryPolicy<T> {
    private readonly minRetryDelay: number = 1000;
    private readonly maxRetryDelay: number = 30000;
    private readonly backoffFactor: number = 2;
    private readonly backoffJitter: number = 1;
    private readonly maxAttempts: number = Infinity;

    constructor(options: Partial<BackoffPolicyOptions> = {}) {
        let {
            minRetryDelay = this.minRetryDelay,
            maxRetryDelay = this.maxRetryDelay,
            backoffFactor = this.backoffFactor,
            backoffJitter = this.backoffJitter,
            maxAttempts = this.maxAttempts
        } = options;

        if (minRetryDelay < 0) {
            throw new Error('The minimum retry delay must be non-negative');
        }

        if (maxRetryDelay < minRetryDelay) {
            throw new Error('The maximum retry delay must be greater than the minimum');
        }

        if (backoffFactor < 1) {
            throw new Error('The backoff factor must be greater than zero');
        }

        if (backoffJitter < 0) {
            throw new Error('The backoff jitter must be non-negative');
        }

        if (maxAttempts < 0) {
            throw new Error('The maximum attempts must be non-negative');
        }

        this.minRetryDelay = minRetryDelay;
        this.maxRetryDelay = maxRetryDelay;
        this.backoffFactor = backoffFactor;
        this.backoffJitter = backoffJitter;
        this.maxAttempts = maxAttempts;
    }

    getDelay(attempt: number): number {
        let delay = Math.min(
            this.maxRetryDelay,
            this.minRetryDelay * (this.backoffFactor ** attempt),
        );

        if (this.backoffJitter > 0) {
            delay += Math.random() * delay;
        }

        return Number(delay.toPrecision(1));
    }

    shouldRetry(beacon: T, attempt: number, error: Error): boolean {
        return attempt < this.maxAttempts;
    }
}