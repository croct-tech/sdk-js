import MixedSchema from '../../src/validation/mixedSchema';

describe('A mixed schema', () => {
    test('should allow anything', () => {
        const type = new MixedSchema();

        function validate(): void {
            type.validate();
        }

        expect(validate).not.toThrow(Error);
    });
});
