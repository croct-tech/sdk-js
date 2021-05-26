import {BooleanType} from '../../src/validation';

describe('A boolean type', () => {
    test('should provide the allowed type', () => {
        expect(new BooleanType().getTypes()).toEqual(['boolean']);
    });

    test.each([
        [null, false],
        ['foo', false],
        [true, true],
        [1, false],
        [1.23, false],
        [['foo', 'bar'], false],
        [{foo: 'bar'}, false],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new BooleanType().isValidType(value)).toBe(expected);
    });

    test('should allow boolean values', () => {
        const type = new BooleanType();

        expect((): void => type.validate(true)).not.toThrow(Error);
        expect((): void => type.validate(false)).not.toThrow(Error);
    });

    test.each([
        [null, 'Expected value of type boolean at path \'/\', actual null.'],
        ['foo', 'Expected value of type boolean at path \'/\', actual string.'],
        [1, 'Expected value of type boolean at path \'/\', actual integer.'],
        [[], 'Expected value of type boolean at path \'/\', actual array.'],
        [{}, 'Expected value of type boolean at path \'/\', actual Object.'],
    ])('should not allow %s', (value: any, message: string) => {
        const type = new BooleanType();

        function validate(): void {
            type.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
