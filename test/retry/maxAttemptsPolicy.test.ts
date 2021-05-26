import {MaxAttemptsPolicy} from '../../src/retry';

describe('A max-attempts policy', () => {
    test('should ensure the delay is non-negative', () => {
        function invalidPolicy(): MaxAttemptsPolicy<any> {
            return new MaxAttemptsPolicy(-1, 1);
        }

        expect(invalidPolicy).toThrow(Error);
        expect(invalidPolicy).toThrow('Delay must be non-negative.');
    });

    test('should ensure the maximum number of attempts is non-negative', () => {
        function invalidPolicy(): MaxAttemptsPolicy<any> {
            return new MaxAttemptsPolicy(1, -1);
        }

        expect(invalidPolicy).toThrow(Error);
        expect(invalidPolicy).toThrow('Max attempts must be non-negative.');
    });

    test('should compute the delay for a given attempt', () => {
        const policy = new MaxAttemptsPolicy(1, 2);

        expect(policy.getDelay()).toBe(1);
    });

    test('should allow retries until the maximum number of attempts is reached', () => {
        const policy = new MaxAttemptsPolicy(1, 2);

        expect(policy.shouldRetry(0)).toBeTruthy();
        expect(policy.shouldRetry(1)).toBeTruthy();
        expect(policy.shouldRetry(2)).toBeFalsy();
        expect(policy.shouldRetry(99)).toBeFalsy();
        expect(policy.shouldRetry(Infinity)).toBeFalsy();
    });
});
