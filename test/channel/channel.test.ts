import {MessageDeliveryError} from '../../src/channel';

describe('MessageDeliveryError', () => {
    it('should initialize a retryable error', () => {
        const error = MessageDeliveryError.retryable('test');

        expect(error.message).toBe('Test');
        expect(error.retryable).toBe(true);
    });

    it('should initialize a non-retryable error', () => {
        const error = MessageDeliveryError.nonRetryable('test');

        expect(error.message).toBe('Test');
        expect(error.retryable).toBe(false);
    });

    it('should initialize a retryable error from another error', () => {
        const cause = new Error('Test');
        const error = MessageDeliveryError.retryable(cause);

        expect(error.message).toBe('Test');
        expect(error.retryable).toBe(true);
        expect(error.stack).toBe(cause.stack);
    });

    it('should initialize a non-retryable error from another error', () => {
        const cause = new Error('Test');
        const error = MessageDeliveryError.nonRetryable(cause);

        expect(error.message).toBe('Test');
        expect(error.retryable).toBe(false);
        expect(error.stack).toBe(cause.stack);
    });
});
