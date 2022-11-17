import {NullLogger} from '../../src/logging';

describe('A null logger', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should not log info messages', () => {
        const info = jest.spyOn(window.console, 'info');

        const logger = new NullLogger();

        logger.info();

        expect(info).toHaveBeenCalledTimes(0);
    });

    it('should not log warn messages', () => {
        const warn = jest.spyOn(window.console, 'warn');

        const logger = new NullLogger();

        logger.warn();

        expect(warn).toHaveBeenCalledTimes(0);
    });

    it('should not log debug messages', () => {
        const debug = jest.spyOn(window.console, 'debug');

        const logger = new NullLogger();

        logger.debug();

        expect(debug).toHaveBeenCalledTimes(0);
    });

    it('should not log error messages', () => {
        const error = jest.spyOn(window.console, 'error');

        const logger = new NullLogger();

        logger.error();

        expect(error).toHaveBeenCalledTimes(0);
    });
});
