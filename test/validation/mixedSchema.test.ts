import {MixedSchema} from '../../src/validation';

describe('A mixed schema', () => {
    it('should allow anything', () => {
        const type = new MixedSchema();

        function validate(): void {
            type.validate();
        }

        expect(validate).not.toThrow();
    });
});
