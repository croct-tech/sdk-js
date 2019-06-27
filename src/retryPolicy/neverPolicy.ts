import {RetryPolicy} from '../retryPolicy';

export class NeverPolicy<T> implements RetryPolicy<T> {
    getDelay(attempt: number): number {
        return Infinity;
    }

    shouldRetry(attempt: number, subject?: T, failure?: any): boolean {
        return false;
    }
}