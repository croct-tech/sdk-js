import {RetryPolicy} from './policy';

export class NeverPolicy<T> implements RetryPolicy<T> {
    public getDelay(): number {
        return Infinity;
    }

    public shouldRetry(): boolean {
        return false;
    }
}
