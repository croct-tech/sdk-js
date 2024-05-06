import {ConsoleLogger} from '../../src/logging';

describe('A console logger', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should log debug messages to the console', () => {
        const consoleDebug = jest.spyOn(console, 'debug').mockImplementation();

        const logger = new ConsoleLogger();

        logger.debug('Debug message.');

        expect(consoleDebug).toHaveBeenCalledWith('Debug message.');
    });

    it('should log debug messages prefixed with a namespace to the console', () => {
        const consoleDebug = jest.spyOn(console, 'debug').mockImplementation();

        const logger = new ConsoleLogger('foo');

        logger.debug('Debug message.');

        expect(consoleDebug).toHaveBeenCalledWith('[foo]', 'Debug message.');
    });

    it('should log info messages to the console', () => {
        const consoleInfo = jest.spyOn(console, 'info').mockImplementation();

        const logger = new ConsoleLogger();

        logger.info('Info message.');

        expect(consoleInfo).toHaveBeenCalledWith('Info message.');
    });

    it('should log info messages prefixed with a namespace to the console', () => {
        const consoleInfo = jest.spyOn(console, 'info').mockImplementation();

        const logger = new ConsoleLogger('foo');

        logger.info('Info message.');

        expect(consoleInfo).toHaveBeenCalledWith('[foo]', 'Info message.');
    });

    it('should log warn messages to the console', () => {
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

        const logger = new ConsoleLogger();

        logger.warn('Warn message.');

        expect(consoleWarn).toHaveBeenCalledWith('Warn message.');
    });

    it('should log warn messages prefixed with a namespace to the console', () => {
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

        const logger = new ConsoleLogger('foo');

        logger.warn('Warn message.');

        expect(consoleWarn).toHaveBeenCalledWith('[foo]', 'Warn message.');
    });

    it('should log error messages to the console', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation();

        const logger = new ConsoleLogger();

        logger.error('Error message.');

        expect(consoleError).toHaveBeenCalledWith('Error message.');
    });

    it('should log error messages prefixed with a namespace to the console', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation();

        const logger = new ConsoleLogger('foo');

        logger.error('Error message.');

        expect(consoleError).toHaveBeenCalledWith('[foo]', 'Error message.');
    });
});
