import {formatCause, formatMessage} from '../src/error';

describe('A error formatter', () => {
    test.each([
        [new Error('Error message.'), 'Error message.'],
        [new Error(''), ''],
        ['foo', 'Foo'],
        ['', 'Unknown error'],
        [null, 'Unknown error'],
    ])('should format the message of the error %p as "%s"', (error: any, message: string) => {
        formatMessage(error);

        expect(formatMessage(error)).toBe(message);
    });

    test.each([
        [new Error('Error message.'), 'error message.'],
        [new Error(''), ''],
        ['Foo', 'foo'],
        ['', 'unknown error'],
        [null, 'unknown error'],
    ])('should format the cause of the error %p as "%s"', (error: any, message: string) => {
        formatMessage(error);

        expect(formatCause(error)).toBe(message);
    });
});
