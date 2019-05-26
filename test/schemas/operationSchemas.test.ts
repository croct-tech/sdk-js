import {TypeSchema} from '../../src/validation';
import {
    addOperation,
    clearOperation,
    combineOperation,
    decrementOperation,
    incrementOperation,
    mergeOperation,
    setOperation,
    unsetOperation,
} from '../../src/schema/operationSchemas';

describe('An operation schema', () => {
    test.each([
        [
            {
                path: 'foo',
                value: 'bar',
            },
            addOperation,
        ],
        [
            {
                path: 'foo.bar',
                value: ['bar'],
            },
            addOperation,
        ],
        [
            {
                path: '[0]',
                value: {foo: 'bar'},
            },
            addOperation,
        ],
        [
            {
                path: 'foo[0]',
                value: 'bar',
            },
            setOperation,
        ],
        [
            {
                path: 'foo',
                value: ['bar'],
            },
            setOperation,
        ],
        [
            {
                path: 'foo',
                value: {foo: 'bar'},
            },
            setOperation,
        ],
        [
            {
                path: 'foo',
                value: 'bar',
            },
            combineOperation,
        ],
        [
            {
                path: 'foo',
                value: ['bar'],
            },
            combineOperation,
        ],
        [
            {
                path: 'foo',
                value: {foo: 'bar'},
            },
            combineOperation,
        ],
        [
            {
                path: 'foo',
                value: ['bar'],
            },
            mergeOperation,
        ],
        [
            {
                path: 'foo',
                value: {foo: 'bar'},
            },
            mergeOperation,
        ],
        [
            {
                path: 'foo',
                value: 1,
            },
            incrementOperation,
        ],
        [
            {
                path: 'foo',
                value: 2,
            },
            decrementOperation,
        ],
        [
            {
                path: 'foo',
            },
            unsetOperation,
        ],
        [
            {
                path: 'foo',
            },
            clearOperation,
        ],
    ])('should allow %s', (value: object, schema: TypeSchema) => {
        function validate(): void {
            schema.validate(value);
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [
            {
                path: 123,
                value: 'bar',
            },
            addOperation,
            'Expected value of type string at path \'/path\', actual integer.',
        ],
        [
            {
                path: 'foo.',
                value: 'bar',
            },
            setOperation,
            'Invalid format at path \'/path\'.',
        ],
        [
            {
                path: '.',
                value: 'bar',
            },
            combineOperation,
            'Invalid format at path \'/path\'.',
        ],
        [
            {
                path: '.bar',
                value: ['bar'],
            },
            mergeOperation,
            'Invalid format at path \'/path\'.',
        ],
        [
            {
                path: '[]',
                value: 1,
            },
            incrementOperation,
            'Invalid format at path \'/path\'.',
        ],
        [
            {
                path: '[0',
                value: 2,
            },
            decrementOperation,
            'Invalid format at path \'/path\'.',
        ],
        [
            {
                path: '0]',
            },
            unsetOperation,
            'Invalid format at path \'/path\'.',
        ],
        [
            {
                path: '@#$',
            },
            clearOperation,
            'Invalid format at path \'/path\'.',
        ],
        [
            {
                path: 'foo',
                value: /not-a-json-value/,
            },
            addOperation,
            'Expected a JSON value at path \'/value\', actual RegExp.',
        ],
        [
            {
                path: 'foo',
                value: /not-a-json-value/,
            },
            setOperation,
            'Expected a JSON value at path \'/value\', actual RegExp.',
        ],
        [
            {
                path: 'foo',
                value: /not-a-json-value/,
            },
            combineOperation,
            'Expected a JSON value at path \'/value\', actual RegExp.',
        ],
        [
            {
                path: 'foo',
                value: 'bar',
            },
            mergeOperation,
            'Expected value of type array or object at path \'/value\', actual string.',
        ],
        [
            {
                path: 'foo',
                value: 'bar',
            },
            incrementOperation,
            'Expected value of type number at path \'/value\', actual string.',
        ],
        [
            {
                path: 'foo',
                value: 'bar',
            },
            decrementOperation,
            'Expected value of type number at path \'/value\', actual string.',
        ],
    ])('should not allow %s', (
        value: object,
        schema: TypeSchema,
        message: string,
    ) => {
        function validate(): void {
            schema.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
