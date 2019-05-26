import BackoffPolicy from '../../src/retryPolicy/backoffPolicy';

describe('A backoff policy', () => {
    test('should not allow a negative minimum retry delay', () => {
        function invalidPolicy(): BackoffPolicy<any> {
            return new BackoffPolicy({
                minRetryDelay: -1,
                maxRetryDelay: 1,
                backoffFactor: 1,
                backoffJitter: 1,
                maxAttempts: 1,
            });
        }

        expect(invalidPolicy).toThrow(Error);
        expect(invalidPolicy).toThrow('The minimum retry delay must be non-negative.');
    });

    test('should not allow a retry delay greater than the minimum retry delay', () => {
        function invalidPolicy(): BackoffPolicy<any> {
            return new BackoffPolicy({
                minRetryDelay: 1,
                maxRetryDelay: 0,
                backoffFactor: 1,
                backoffJitter: 1,
                maxAttempts: 1,
            });
        }

        expect(invalidPolicy).toThrow(Error);
        expect(invalidPolicy).toThrow('The maximum retry delay must be greater than the minimum.');
    });

    test('should not allow a negative backoff factor', () => {
        function invalidPolicy(): BackoffPolicy<any> {
            return new BackoffPolicy({
                minRetryDelay: 0,
                maxRetryDelay: 1,
                backoffFactor: 0,
                backoffJitter: 1,
                maxAttempts: 1,
            });
        }

        expect(invalidPolicy).toThrow(Error);
        expect(invalidPolicy).toThrow('The backoff factor must be greater than zero.');
    });

    test('should not allow a negative backoff jitter', () => {
        function invalidPolicy(): BackoffPolicy<any> {
            return new BackoffPolicy({
                minRetryDelay: 0,
                maxRetryDelay: 1,
                backoffFactor: 1,
                backoffJitter: -1,
                maxAttempts: 1,
            });
        }

        expect(invalidPolicy).toThrow(Error);
        expect(invalidPolicy).toThrow('The backoff jitter must be non-negative.');
    });

    test('should not allow a negative maximum number of attempts', () => {
        function invalidPolicy(): BackoffPolicy<any> {
            return new BackoffPolicy({
                minRetryDelay: 0,
                maxRetryDelay: 1,
                backoffFactor: 1,
                backoffJitter: 1,
                maxAttempts: -1,
            });
        }

        expect(invalidPolicy).toThrow(Error);
        expect(invalidPolicy).toThrow('The maximum attempts must be non-negative.');
    });

    test('should not have a negative minimum retry delay', () => {
        function invalidPolicy(): BackoffPolicy<any> {
            return new BackoffPolicy({
                minRetryDelay: -1,
                maxRetryDelay: 1,
                backoffFactor: 1,
                backoffJitter: 1,
                maxAttempts: 1,
            });
        }

        expect(invalidPolicy).toThrow(Error);
        expect(invalidPolicy).toThrow('The minimum retry delay must be non-negative.');
    });

    test('should compute a delay for a given attempt between the allowed minimum and maximum values', () => {
        const policy = new BackoffPolicy({
            minRetryDelay: 10,
            maxRetryDelay: 100000,
            backoffFactor: 2,
            backoffJitter: 1,
            maxAttempts: 100,
        });

        for (let i = 1; i < 100; i++) {
            const delay = policy.getDelay(i);

            expect(delay).toBeGreaterThanOrEqual(10);
            expect(delay).toBeLessThanOrEqual(100000);
        }
    });

    test('should vary the delay between each attempts based on backoff factor', () => {
        const policy = new BackoffPolicy({
            minRetryDelay: 10,
            maxRetryDelay: 100,
            backoffFactor: 3,
            backoffJitter: 0,
            maxAttempts: 6,
        });

        expect(policy.getDelay(1)).toBe(10);
        expect(policy.getDelay(2)).toBe(10);
        expect(policy.getDelay(3)).toBe(27);
        expect(policy.getDelay(4)).toBe(81);
        expect(policy.getDelay(5)).toBe(100);
        expect(policy.getDelay(6)).toBe(100);
    });

    test('should allow specifying a fractional backoff factor', () => {
        const policy = new BackoffPolicy({
            minRetryDelay: 1,
            maxRetryDelay: 5,
            backoffFactor: 1.5,
            backoffJitter: 0,
            maxAttempts: 5,
        });

        expect(policy.getDelay(1)).toBe(1);
        expect(policy.getDelay(2)).toBe(2);
        expect(policy.getDelay(3)).toBe(3);
        expect(policy.getDelay(4)).toBe(5);
        expect(policy.getDelay(5)).toBe(5);
    });

    test('should allow retries until the maximum number of attempts is reached', () => {
        const policy = new BackoffPolicy({
            minRetryDelay: 1,
            maxRetryDelay: 2,
            backoffFactor: 1,
            backoffJitter: 1,
            maxAttempts: 3,
        });

        expect(policy.shouldRetry(0)).toBeTruthy();
        expect(policy.shouldRetry(1)).toBeTruthy();
        expect(policy.shouldRetry(2)).toBeTruthy();
        expect(policy.shouldRetry(3)).toBeFalsy();
        expect(policy.shouldRetry(4)).toBeFalsy();
    });
});
