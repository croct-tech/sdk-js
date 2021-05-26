import {tokenScopeSchema} from '../../src/schema';

describe('The token schema', () => {
    test.each([
        ['global'],
        ['contextual'],
        ['isolated'],
    ])('should allow the value "%s"', (value: string) => {
        function validate(): void {
            tokenScopeSchema.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test('should not allow values other than the defined', () => {
        function validate(): void {
            tokenScopeSchema.validate('foo');
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(
            'Unexpected value at path \'/\', expecting \'global\', \'contextual\' or \'isolated\', found \'foo\'.',
        );
    });
});
