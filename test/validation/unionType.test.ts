import NumberType from '../../src/validation/numberType';
import StringType from '../../src/validation/stringType';
import UnionType from '../../src/validation/unionType';

describe('An union type', () => {
    test('should provide the allowed types', () => {
        expect(new UnionType(new StringType(), new NumberType()).getTypes()).toEqual(['string', 'number']);
    });

    test.each([
        [null, false],
        ['foo', true],
        [true, false],
        [1, true],
        [1.23, true],
        [['foo', 'bar'], false],
        [{foo: 'bar'}, false],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new UnionType(new StringType(), new NumberType()).isValidType(value)).toBe(expected);
    });

    test.each([
        [1],
        [1.23],
        ['foo'],
    ])('should allow a value if at least one type in the union allows it (%s)', (value: any) => {
        function validate(): void {
            new UnionType(new StringType(), new NumberType()).validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [null, "Expected value of type string or number at path '/', actual null."],
        [true, "Expected value of type string or number at path '/', actual boolean."],
        [[], "Expected value of type string or number at path '/', actual array."],
        [{}, "Expected value of type string or number at path '/', actual Object."],
    ])('should not allow a value if none of the types in the union allow it (%s)', (value: any, message: string) => {
        function validate(): void {
            new UnionType(new StringType(), new NumberType()).validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
