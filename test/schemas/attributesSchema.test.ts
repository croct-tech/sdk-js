import {attributeNameSchema} from '../../src/schema/attributeSchema';

describe('The attribute name schema', () => {
    test.each([
        ['looooooooooooooooooooooooooooooooongKeyWith50Chars'],
        ['_someKey'],
    ])('should allow %s', (value: string) => {
        function validate(): void {
            attributeNameSchema.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [
            'looooooooooooooooooooooooooooooooooooooooooooongKey',
            'Expected at most 50 characters at path \'/\', actual 51.',
        ],
        [
            '0abc',
            'Invalid identifier format at path \'/\'.',
        ],
    ])('should not allow %s', (value: string, message: string) => {
        function validate(): void {
            attributeNameSchema.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
