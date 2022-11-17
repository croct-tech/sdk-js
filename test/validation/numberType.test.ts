import {NumberType} from '../../src/validation';

describe('A number type', () => {
    it('should provide the allowed type', () => {
        expect(new NumberType({}).getTypes()).toEqual(['number']);
    });

    it.each([
        [null, false],
        ['foo', false],
        [true, false],
        [1, true],
        [1.23, true],
        [['foo', 'bar'], false],
        [{foo: 'bar'}, false],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new NumberType().isValidType(value)).toBe(expected);
    });

    it.each([
        [1, new NumberType({integer: true})],
        [1.23, new NumberType({integer: false})],
        [2, new NumberType({minimum: 1})],
        [2, new NumberType({maximum: 3})],
    ])('show allow %s with %o', (value: number, type: NumberType) => {
        function validate(): void {
            type.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [null, new NumberType({}), 'Expected value of type number at path \'/\', actual null.'],
        ['foo', new NumberType({}), 'Expected value of type number at path \'/\', actual string.'],
        [[], new NumberType({}), 'Expected value of type number at path \'/\', actual array.'],
        [{}, new NumberType({}), 'Expected value of type number at path \'/\', actual Object.'],
        [1.23, new NumberType({integer: true}), 'Expected value of type integer at path \'/\', actual number.'],
        [0, new NumberType({minimum: 1}), "Expected a value greater than or equal to 1 at path '/', actual 0."],
        [4, new NumberType({maximum: 3}), "Expected a value less than or equal to 3 at path '/', actual 4."],
    ])('should not allow %s with %o', (
        value: any,
        type: NumberType,
        message: string,
    ) => {
        function validate(): void {
            type.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
