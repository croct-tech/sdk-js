import {NeverPolicy} from '../../src/retry';

describe('A never policy', () => {
    test('should impose an infinity delay', () => {
        const policy = new NeverPolicy();

        expect(policy.getDelay()).toBe(Infinity);
    });

    test('should never retry', () => {
        const policy = new NeverPolicy();

        expect(policy.shouldRetry()).toBeFalsy();
    });
});
