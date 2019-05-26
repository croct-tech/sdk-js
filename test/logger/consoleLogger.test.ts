import ConsoleLogger from '../../src/logger/consoleLogger';

describe('A console logger', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should log debug messages to the console', () => {
        const consoleDebug = jest.spyOn(global.console, 'debug').mockImplementation();

        const logger = new ConsoleLogger();

        logger.debug('Debug message.');

        expect(consoleDebug).toHaveBeenCalledWith('Debug message.');
    });

    test('should log debug messages prefixed with a namespace to the console', () => {
        const consoleDebug = jest.spyOn(global.console, 'debug').mockImplementation();

        const logger = new ConsoleLogger('foo');

        logger.debug('Debug message.');

        expect(consoleDebug).toHaveBeenCalledWith('[foo]', 'Debug message.');
    });

    test('should log info messages to the console', () => {
        const consoleInfo = jest.spyOn(global.console, 'info').mockImplementation();

        const logger = new ConsoleLogger();

        logger.info('Info message.');

        expect(consoleInfo).toHaveBeenCalledWith('Info message.');
    });

    test('should log info messages prefixed with a namespace to the console', () => {
        const consoleInfo = jest.spyOn(global.console, 'info').mockImplementation();

        const logger = new ConsoleLogger('foo');

        logger.info('Info message.');

        expect(consoleInfo).toHaveBeenCalledWith('[foo]', 'Info message.');
    });

    test('should log warn messages to the console', () => {
        const consoleWarn = jest.spyOn(global.console, 'warn').mockImplementation();

        const logger = new ConsoleLogger();

        logger.warn('Warn message.');

        expect(consoleWarn).toHaveBeenCalledWith('Warn message.');
    });

    test('should log warn messages prefixed with a namespace to the console', () => {
        const consoleWarn = jest.spyOn(global.console, 'warn').mockImplementation();

        const logger = new ConsoleLogger('foo');

        logger.warn('Warn message.');

        expect(consoleWarn).toHaveBeenCalledWith('[foo]', 'Warn message.');
    });

    test('should log error messages to the console', () => {
        const consoleError = jest.spyOn(global.console, 'error').mockImplementation();

        const logger = new ConsoleLogger();

        logger.error('Error message.');

        expect(consoleError).toHaveBeenCalledWith('Error message.');
    });

    test('should log error messages prefixed with a namespace to the console', () => {
        const consoleError = jest.spyOn(global.console, 'error').mockImplementation();

        const logger = new ConsoleLogger('foo');

        logger.error('Error message.');

        expect(consoleError).toHaveBeenCalledWith('[foo]', 'Error message.');
    });
});
