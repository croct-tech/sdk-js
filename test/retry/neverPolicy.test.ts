import {NeverPolicy} from '../../src/retry';

describe('A never policy', () => {
    it('should impose an infinity delay', () => {
        const policy = new NeverPolicy();

        expect(policy.getDelay()).toBe(Infinity);
    });

    it('should never retry', () => {
        const policy = new NeverPolicy();

        expect(policy.shouldRetry()).toBeFalsy();
    });
});
