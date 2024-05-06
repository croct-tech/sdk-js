import {Logger} from '../../src/logging';
import {FilteredLogger} from '../../src/logging/filteredLogger';

describe('A filtered logger', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should only log messages allowed by the filter', () => {
        const results = [
            'debug',
            'debug',
            'debug',
            'debug',
            'info',
            'info',
            'info',
            'info',
            'warn',
            'warn',
            'warn',
            'warn',
            'error',
            'error',
            'error',
            'error',
        ];

        let index = 0;
        const filter = jest.fn((level: string): boolean => level === results[index++]);

        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = new FilteredLogger({
            logger: testLogger,
            allowFilter: filter,
        });

        logger.debug('Debug message.');
        logger.info('Info message.');
        logger.warn('Warn message.');
        logger.error('Error message.');

        expect(testLogger.debug).toHaveBeenCalledTimes(1);
        expect(testLogger.debug).toHaveBeenCalledWith('Debug message.');
        expect(testLogger.info).not.toHaveBeenCalled();
        expect(testLogger.warn).not.toHaveBeenCalled();
        expect(testLogger.error).not.toHaveBeenCalled();

        logger.debug('Debug message.');
        logger.info('Info message.');
        logger.warn('Warn message.');
        logger.error('Error message.');

        expect(testLogger.debug).toHaveBeenCalledTimes(1);
        expect(testLogger.info).toHaveBeenCalledTimes(1);
        expect(testLogger.info).toHaveBeenCalledWith('Info message.');
        expect(testLogger.warn).not.toHaveBeenCalled();
        expect(testLogger.error).not.toHaveBeenCalled();

        logger.debug('Debug message.');
        logger.info('Info message.');
        logger.warn('Warn message.');
        logger.error('Error message.');

        expect(testLogger.debug).toHaveBeenCalledTimes(1);
        expect(testLogger.info).toHaveBeenCalledTimes(1);
        expect(testLogger.warn).toHaveBeenCalledTimes(1);
        expect(testLogger.warn).toHaveBeenCalledWith('Warn message.');
        expect(testLogger.error).not.toHaveBeenCalled();

        logger.debug('Debug message.');
        logger.info('Info message.');
        logger.warn('Warn message.');
        logger.error('Error message.');

        expect(testLogger.debug).toHaveBeenCalledTimes(1);
        expect(testLogger.info).toHaveBeenCalledTimes(1);
        expect(testLogger.warn).toHaveBeenCalledTimes(1);
        expect(testLogger.error).toHaveBeenCalledTimes(1);
        expect(testLogger.error).toHaveBeenCalledWith('Error message.');
    });

    it('should include only the specified log levels', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = FilteredLogger.include(testLogger, ['info', 'warn']);

        logger.debug('Debug message.');
        logger.info('Info message.');
        logger.warn('Warn message.');
        logger.error('Error message.');

        expect(testLogger.debug).not.toHaveBeenCalled();
        expect(testLogger.info).toHaveBeenCalledTimes(1);
        expect(testLogger.info).toHaveBeenCalledWith('Info message.');
        expect(testLogger.warn).toHaveBeenCalledTimes(1);
        expect(testLogger.warn).toHaveBeenCalledWith('Warn message.');
        expect(testLogger.error).not.toHaveBeenCalled();
    });

    it('should exclude only the specified log levels', () => {
        const testLogger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const logger = FilteredLogger.exclude(testLogger, ['info', 'warn']);

        logger.debug('Debug message.');
        logger.info('Info message.');
        logger.warn('Warn message.');
        logger.error('Error message.');

        expect(testLogger.debug).toHaveBeenCalledTimes(1);
        expect(testLogger.debug).toHaveBeenCalledWith('Debug message.');
        expect(testLogger.info).not.toHaveBeenCalled();
        expect(testLogger.warn).not.toHaveBeenCalled();
        expect(testLogger.error).toHaveBeenCalledTimes(1);
        expect(testLogger.error).toHaveBeenCalledWith('Error message.');
    });
});
