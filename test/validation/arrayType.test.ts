import {ArrayType, NumberType} from '../../src/validation';

describe('An array type', () => {
    it('should provide the allowed type', () => {
        expect(new ArrayType().getTypes()).toEqual(['array']);
    });

    it.each([
        [null, false],
        ['foo', false],
        [true, false],
        [1, false],
        [1.23, false],
        [['foo', 'bar'], true],
        [{foo: 'bar'}, false],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new ArrayType().isValidType(value)).toBe(expected);
    });

    it.each([
        [[1], new ArrayType({minItems: 1})],
        [[1], new ArrayType({maxItems: 1})],
        [[1], new ArrayType({items: new NumberType({})})],
    ])('should allow %s with %o', (value: any[], type: ArrayType) => {
        function validate(): void {
            type.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [null, new ArrayType({}), 'Expected value of type array at path \'/\', actual null.'],
        ['a', new ArrayType({}), 'Expected value of type array at path \'/\', actual string.'],
        [1, new ArrayType({}), 'Expected value of type array at path \'/\', actual integer.'],
        [{}, new ArrayType({}), 'Expected value of type array at path \'/\', actual Object.'],
        [[], new ArrayType({minItems: 1}), "Expected at least 1 item at path '/', actual 0."],
        [[1, 2], new ArrayType({maxItems: 1}), "Expected at most 1 item at path '/', actual 2."],
        [[1, 2], new ArrayType({minItems: 1, maxItems: 1}), "Expected exactly 1 item at path '/', actual 2."],
        [
            ['b'],
            new ArrayType({items: new NumberType({})}),
            "Expected value of type number at path '/0', actual string.",
        ],
    ])('should not allow %s with %o', (
        value: any,
        type: ArrayType,
        message: string,
    ) => {
        function validate(): void {
            type.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
