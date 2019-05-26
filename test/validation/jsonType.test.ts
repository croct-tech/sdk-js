import {JsonArrayType, JsonObjectType, JsonPrimitiveType, JsonType} from '../../src/validation/jsonType';

describe('A JSON array type', () => {
    test('should the allowed type', () => {
        expect(new JsonArrayType().getTypes()).toEqual(['array']);
    });

    test.each([
        [null, false],
        ['foo', false],
        [true, false],
        [1, false],
        [1.23, false],
        [['foo', 'bar'], true],
        [{foo: 'bar'}, false],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new JsonArrayType().isValidType(value)).toBe(expected);
    });

    test.each([
        [['foo', 'bar']],
        [['foo', {bar: 1}]],
    ])('should allow %s', (value: any) => {
        function validate(): void {
            new JsonArrayType().validate(value);
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [null, 'Expected a JSON array at path \'/\', actual null.'],
        ['foo', 'Expected a JSON array at path \'/\', actual string.'],
        [true, 'Expected a JSON array at path \'/\', actual boolean.'],
        [1, 'Expected a JSON array at path \'/\', actual integer.'],
        [1.23, 'Expected a JSON array at path \'/\', actual number.'],
        [new Object('foo'), 'Expected a JSON array at path \'/\', actual String.'],
        [{foo: 1}, 'Expected a JSON array at path \'/\', actual Object.'],
        [{bar: 2}, 'Expected a JSON array at path \'/\', actual Object.'],
    ])('should not allow %s', (value: any, message: string) => {
        function validate(): void {
            new JsonArrayType().validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});

describe('A JSON object type', () => {
    test('should provide the allowed type', () => {
        expect(new JsonObjectType().getTypes()).toEqual(['object']);
    });

    test.each([
        [null, false],
        ['foo', false],
        [true, false],
        [1, false],
        [1.23, false],
        [['foo', 'bar'], false],
        [{foo: 'bar'}, true],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new JsonObjectType().isValidType(value)).toBe(expected);
    });

    test.each([
        [{foo: 1}],
        [{bar: 2}],
    ])('should allow %s', (value: any) => {
        function validate(): void {
            new JsonObjectType().validate(value);
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [null, 'Expected a JSON object at path \'/\', actual null.'],
        ['foo', 'Expected a JSON object at path \'/\', actual string.'],
        [true, 'Expected a JSON object at path \'/\', actual boolean.'],
        [1, 'Expected a JSON object at path \'/\', actual integer.'],
        [1.23, 'Expected a JSON object at path \'/\', actual number.'],
        [['foo', 'bar'], 'Expected a JSON object at path \'/\', actual array.'],
        [['foo', {bar: 1}], 'Expected a JSON object at path \'/\', actual array.'],
        [new Object('foo'), 'Expected a JSON object at path \'/\', actual String.'],
    ])('should not allow %s', (value: any, message: string) => {
        function validate(): void {
            expect((): void => new JsonObjectType().validate(value)).not.toThrowError(Error);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});

describe('A JSON primitive type', () => {
    test('should provide the allowed types', () => {
        expect(new JsonPrimitiveType().getTypes()).toEqual(['null', 'number', 'string', 'boolean']);
    });

    test.each([
        [null, true],
        ['foo', true],
        [true, true],
        [1, true],
        [1.23, true],
        [['foo', 'bar'], false],
        [{foo: 'bar'}, false],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new JsonPrimitiveType().isValidType(value)).toBe(expected);
    });

    test.each([
        [null],
        ['foo'],
        [true],
        [1],
        [1.23],
    ])('should allow %s', (value: any) => {
        function validate(): void {
            new JsonPrimitiveType().validate(value);
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [['foo', 'bar'], 'Expected a JSON primitive at path \'/\', actual array.'],
        [['foo', {bar: 1}], 'Expected a JSON primitive at path \'/\', actual array.'],
        [new Object('foo'), 'Expected a JSON primitive at path \'/\', actual String.'],
        [{foo: 1}, 'Expected a JSON primitive at path \'/\', actual Object.'],
        [{bar: 2}, 'Expected a JSON primitive at path \'/\', actual Object.'],
    ])('should not allow %s', (value: any, message: string) => {
        function validate(): void {
            new JsonPrimitiveType().validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});

describe('A JSON value type', () => {
    test('should provide the allowed types', () => {
        expect(new JsonType().getTypes()).toEqual(['null', 'number', 'string', 'boolean', 'array', 'object']);
    });

    test.each([
        [null, true],
        ['foo', true],
        [true, true],
        [1, true],
        [1.23, true],
        [['foo', 'bar'], true],
        [{foo: 'bar'}, true],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new JsonType().isValidType(value)).toBe(expected);
    });

    test.each([
        [null],
        ['foo'],
        [true],
        [1],
        [1.23],
        [['foo', 'bar']],
        [['foo', {bar: 1}]],
        [{foo: 1}],
        [{bar: 2}],
    ])('should allow %s', (value: any) => {
        function validate(): void {
            new JsonType().validate(value);
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [new Object('foo'), 'Expected a JSON value at path \'/\', actual String.'],
    ])('should not allow %s', (value: any, message: string) => {
        function validate(): void {
            new JsonType().validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
