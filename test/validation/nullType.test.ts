import NullType from '../../src/validation/nullType';

describe('A null type', () => {
    test('should provide the allowed type', () => {
        expect(new NullType().getTypes()).toEqual(['null']);
    });

    test.each([
        [null, true],
        ['foo', false],
        [true, false],
        [1, false],
        [1.23, false],
        [['foo', 'bar'], false],
        [{foo: 'bar'}, false],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new NullType().isValidType(value)).toBe(expected);
    });

    test('should allow a null value', () => {
        const type = new NullType();

        expect((): void => type.validate(null)).not.toThrow(Error);
    });

    test.each([
        [true, 'Expected value of type null at path \'/\', actual boolean.'],
        ['foo', 'Expected value of type null at path \'/\', actual string.'],
        [1, 'Expected value of type null at path \'/\', actual integer.'],
        [[], 'Expected value of type null at path \'/\', actual array.'],
        [{}, 'Expected value of type null at path \'/\', actual Object.'],
    ])('should not allow %s', (value: any, message: string) => {
        const type = new NullType();

        function validate(): void {
            type.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
