import type {Logger} from '../../src/logging';
import {DeduplicatedLogger} from '../../src/logging/deduplicatedLogger';

describe('A deduplicated logger', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should log a message the first time it is seen', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = new DeduplicatedLogger(testLogger);

        logger.debug('Debug message.');
        logger.info('Info message.');
        logger.warn('Warn message.');
        logger.error('Error message.');

        expect(testLogger.debug).toHaveBeenCalledTimes(1);
        expect(testLogger.debug).toHaveBeenCalledWith('Debug message.');
        expect(testLogger.info).toHaveBeenCalledTimes(1);
        expect(testLogger.info).toHaveBeenCalledWith('Info message.');
        expect(testLogger.warn).toHaveBeenCalledTimes(1);
        expect(testLogger.warn).toHaveBeenCalledWith('Warn message.');
        expect(testLogger.error).toHaveBeenCalledTimes(1);
        expect(testLogger.error).toHaveBeenCalledWith('Error message.');
    });

    it('should not log duplicate messages in the same level', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = new DeduplicatedLogger(testLogger);

        logger.debug('Same message.');
        logger.debug('Same message.');
        logger.info('Same message.');
        logger.info('Same message.');
        logger.warn('Same message.');
        logger.warn('Same message.');
        logger.error('Same message.');
        logger.error('Same message.');

        expect(testLogger.debug).toHaveBeenCalledTimes(1);
        expect(testLogger.debug).toHaveBeenCalledWith('Same message.');
        expect(testLogger.warn).toHaveBeenCalledTimes(1);
        expect(testLogger.warn).toHaveBeenCalledWith('Same message.');
        expect(testLogger.error).toHaveBeenCalledTimes(1);
        expect(testLogger.error).toHaveBeenCalledWith('Same message.');
    });

    it('should log different messages independently', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = new DeduplicatedLogger(testLogger);

        logger.info('First message.');
        logger.info('Second message.');
        logger.info('Third message.');

        expect(testLogger.info).toHaveBeenCalledTimes(3);
        expect(testLogger.info).toHaveBeenNthCalledWith(1, 'First message.');
        expect(testLogger.info).toHaveBeenNthCalledWith(2, 'Second message.');
        expect(testLogger.info).toHaveBeenNthCalledWith(3, 'Third message.');
    });

    it('should evict the oldest message when at capacity', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = new DeduplicatedLogger(testLogger, 3);

        logger.info('Message 1');
        logger.info('Message 2');
        logger.info('Message 3');

        expect(testLogger.info).toHaveBeenCalledTimes(3);

        // This should evict "Message 1"
        logger.info('Message 4');

        expect(testLogger.info).toHaveBeenCalledTimes(4);

        // "Message 1" should now be loggable again
        logger.info('Message 1');

        expect(testLogger.info).toHaveBeenCalledTimes(5);
        expect(testLogger.info).toHaveBeenLastCalledWith('Message 1');
    });

    it('should keep recently accessed messages in the cache', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = new DeduplicatedLogger(testLogger, 3);

        logger.info('Message 1');
        logger.info('Message 2');
        logger.info('Message 3');

        expect(testLogger.info).toHaveBeenCalledTimes(3);

        // Access "Message 1" again (moves it to most recent)
        logger.info('Message 1');

        expect(testLogger.info).toHaveBeenCalledTimes(3);

        // Add new message - should evict "Message 2" (now oldest)
        logger.info('Message 4');

        expect(testLogger.info).toHaveBeenCalledTimes(4);

        // "Message 1", "Message 3", and "Message 4" should still be cached
        logger.info('Message 1');
        logger.info('Message 3');
        logger.info('Message 4');

        expect(testLogger.info).toHaveBeenCalledTimes(4);

        // "Message 2" was evicted, should be loggable again
        logger.info('Message 2');

        expect(testLogger.info).toHaveBeenCalledTimes(5);
    });

    it('should use default max size of 100', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = new DeduplicatedLogger(testLogger);

        // Log 100 unique messages
        for (let i = 0; i < 100; i++) {
            logger.info(`Message ${i}`);
        }

        expect(testLogger.info).toHaveBeenCalledTimes(100);

        // All 100 should still be cached (not logged again)
        for (let i = 0; i < 100; i++) {
            logger.info(`Message ${i}`);
        }

        expect(testLogger.info).toHaveBeenCalledTimes(100);

        // Adding 101st should evict the oldest
        logger.info('Message 100');

        expect(testLogger.info).toHaveBeenCalledTimes(101);

        // "Message 0" should be loggable again
        logger.info('Message 0');

        expect(testLogger.info).toHaveBeenCalledTimes(102);
    });

    it('should throw an error for non-positive max size', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        expect(() => new DeduplicatedLogger(testLogger, 0)).toThrow('maxSize must be greater than 0');
        expect(() => new DeduplicatedLogger(testLogger, -10)).toThrow('maxSize must be greater than 0');
        expect(() => new DeduplicatedLogger(testLogger, 2.5)).toThrow('maxSize must be greater than 0');
    });
});
