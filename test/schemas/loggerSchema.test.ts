import {loggerSchema} from '../../src/schema';

describe('The logger schema', () => {
    test('should allow valid loggers', () => {
        const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            extra: true,
        };

        expect(() => loggerSchema.validate(logger)).not.toThrow();
    });

    test.each([
        [
            {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
            "Missing property '/debug'.",
        ],
        [
            {
                debug: 1,
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
            "Expected value of type function at path '/debug', actual integer.",
        ],
        [
            {
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
            "Missing property '/info'.",
        ],
        [
            {
                debug: jest.fn(),
                info: 1,
                warn: jest.fn(),
                error: jest.fn(),
            },
            "Expected value of type function at path '/info', actual integer.",
        ],
        [
            {
                debug: jest.fn(),
                info: jest.fn(),
                error: jest.fn(),
            },
            "Missing property '/warn'.",
        ],
        [
            {
                debug: jest.fn(),
                info: jest.fn(),
                warn: 1,
                error: jest.fn(),
            },
            "Expected value of type function at path '/warn', actual integer.",
        ],
        [
            {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
            },
            "Missing property '/error'.",
        ],
        [
            {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: 1,
            },
            "Expected value of type function at path '/error', actual integer.",
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            loggerSchema.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
