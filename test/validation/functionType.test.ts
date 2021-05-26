import {FunctionType} from '../../src/validation';

describe('A function type', () => {
    test('should provide the allowed type', () => {
        expect(new FunctionType().getTypes()).toEqual(['function']);
    });

    test.each([
        [(): void => {}, true],
        [jest.fn(), true],
        [1, false],
        [null, false],
        ['foo', false],
        [true, false],
        [new Object('foo'), false],
    ])('should determine whether the type of %p is valid', (value: any, expected: boolean) => {
        expect(new FunctionType().isValidType(value)).toBe(expected);
    });

    test('should allow functions', () => {
        const type = new FunctionType();

        expect((): void => type.validate(() => {})).not.toThrow(Error);
        expect((): void => type.validate(jest.fn())).not.toThrow(Error);
    });

    test.each([
        [null, "Expected value of type function at path '/', actual null."],
        ['foo', "Expected value of type function at path '/', actual string."],
        [1, "Expected value of type function at path '/', actual integer."],
        [[], "Expected value of type function at path '/', actual array."],
        [{}, "Expected value of type function at path '/', actual Object."],
    ])('should not allow %s', (value: any, message: string) => {
        const type = new FunctionType();

        function validate(): void {
            type.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
