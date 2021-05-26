import {RetryPolicy} from './policy';

export class ArbitraryPolicy<T> implements RetryPolicy<T> {
    private readonly delays: number[];

    public constructor(delays: number[]) {
        if (delays.length < 1) {
            throw new Error('The list of delays cannot be empty.');
        }

        this.delays = [...delays];
    }

    public getDelay(attempt: number): number {
        return this.delays[Math.min(attempt < 0 ? 0 : attempt, this.delays.length - 1)];
    }

    public shouldRetry(): boolean {
        return true;
    }
}
