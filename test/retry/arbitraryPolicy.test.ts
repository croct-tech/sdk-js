import {ArbitraryPolicy} from '../../src/retry';

describe('An arbitrary policy', () => {
    it('should ensure the delay list is not empty', () => {
        function invalidPolicy(): ArbitraryPolicy<any> {
            return new ArbitraryPolicy([]);
        }

        expect(invalidPolicy).toThrow();
        expect(invalidPolicy).toThrow('The list of delays cannot be empty.');
    });

    it('should map the current attempt to the respective delay', () => {
        const policy = new ArbitraryPolicy([1, 2, 3]);

        expect(policy.getDelay(-1)).toBe(1);
        expect(policy.getDelay(0)).toBe(1);
        expect(policy.getDelay(1)).toBe(2);
        expect(policy.getDelay(3)).toBe(3);
        expect(policy.getDelay(4)).toBe(3);
        expect(policy.getDelay(5)).toBe(3);
        expect(policy.getDelay(6)).toBe(3);
    });

    it('should always allow retries', () => {
        const policy = new ArbitraryPolicy([1]);

        expect(policy.shouldRetry()).toBe(true);
        expect(policy.shouldRetry()).toBe(true);
        expect(policy.shouldRetry()).toBe(true);
    });
});
