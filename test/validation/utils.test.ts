import {describe as describeValue, formatPath} from '../../src/validation/violation';

class SomeClass {}

describe('Validation utilities', () => {
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
