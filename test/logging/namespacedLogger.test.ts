import {NamespacedLogger, Logger} from '../../src/logging';

describe('A namespaced logger', () => {
    let innerLogger: Logger;
    let logger: NamespacedLogger;

    beforeEach(() => {
        innerLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        logger = new NamespacedLogger(innerLogger, 'foo');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should prefix debug messages with a namespace', () => {
        logger.debug('Debug message.');

        expect(innerLogger.debug).toHaveBeenCalledWith('[foo] Debug message.');
    });

    it('should prefix info messages with a namespace', () => {
        logger.info('Info message.');

        expect(innerLogger.info).toHaveBeenCalledWith('[foo] Info message.');
    });

    it('should prefix warn messages with a namespace', () => {
        logger.warn('Warn message.');

        expect(innerLogger.warn).toHaveBeenCalledWith('[foo] Warn message.');
    });

    it('should prefix error messages with a namespace', () => {
        logger.error('Error message.');

        expect(innerLogger.error).toHaveBeenCalledWith('[foo] Error message.');
    });
});
