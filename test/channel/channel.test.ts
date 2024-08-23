import {MessageDeliveryError} from '../../src/channel';

describe('MessageDeliveryError', () => {
    it('should initialize the error message and retryable flag', () => {
        const error = new MessageDeliveryError('test', true);

        expect(error.message).toBe('test');
        expect(error.retryable).toBe(true);
    });

    it('should return the cause if it is a MessageDeliveryError', () => {
        const cause = new MessageDeliveryError('test', true);
        const error = MessageDeliveryError.fromCause(cause);

        expect(error).toBe(cause);
    });

    it('should initialize the error as retryable from arbitrary causes', () => {
        const cause = new Error('test');
        const error = MessageDeliveryError.fromCause(cause);

        expect(error.message).toBe('Test');
        expect(error.retryable).toBe(true);
        expect(error.stack).toBe(cause.stack);
    });

    it('should initialize the error using the retryable flag from arbitrary causes', () => {
        const cause = new Error('Test');
        const error = MessageDeliveryError.fromCause(cause, false);

        expect(error.message).toBe('Test');
        expect(error.retryable).toBe(false);
        expect(error.stack).toBe(cause.stack);
    });
});
