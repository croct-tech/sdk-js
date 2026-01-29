import {tokenScopeSchema} from '../../src/schema';
import type {TokenScope} from '../../src/context';

describe('The token schema', () => {
    it.each<TokenScope[]>([
        ['global'],
        ['contextual'],
        ['isolated'],
    ])('should allow the value "%s"', value => {
        function validate(): void {
            tokenScopeSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it('should not allow values other than the defined', () => {
        function validate(): void {
            tokenScopeSchema.validate('foo');
        }

        expect(validate).toThrow(new Error(
            'Unexpected value at path \'/\', expecting \'global\', \'contextual\' or \'isolated\', found \'foo\'.',
        ));
    });
});
