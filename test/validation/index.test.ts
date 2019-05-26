import {describe as describeValue, formatPath, Violation} from '../../src/validation';

class SomeClass {}

describe('A validation', () => {
    test('should provide a function for formatting paths', () => {
        expect(formatPath(['foo', 'bar', 'baz'])).toEqual('/foo/bar/baz');
    });

    test.each([
        [null, 'null'],
        ['foo', 'string'],
        [true, 'boolean'],
        [1, 'integer'],
        [1.23, 'number'],
        [['foo', 'bar'], 'array'],
        [{foo: 'bar'}, 'Object'],
        [new Object('foo'), 'String'],
        [new SomeClass(), 'SomeClass'],
    ])('should provide a function for describing %o as %p', (value: any, expected: string) => {
        expect(describeValue(value)).toBe(expected);
    });
});

describe('A violation', () => {
    test('should provide the value path', () => {
        const violation = new Violation('This is a message.', ['foo', 'bar', 'baz'], {});

        expect(violation.path).toEqual(['foo', 'bar', 'baz']);
    });

    test('should provide the violation parameters', () => {
        const violation = new Violation('This is a message.', [], {first: '1', second: '2'});

        expect(violation.params).toEqual({first: '1', second: '2'});
    });
});
