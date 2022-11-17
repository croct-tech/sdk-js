import {fetchOptionsSchema} from '../../src/schema';

describe('The content fetcher option schema', () => {
    test.each([
        [{}],
        [{
            timeout: 1,
        }],
        [{
            version: 1,
        }],
        [{
            version: '1',
        }],
        [{
            preferredLocale: 'pt',
        }],
        [{
            preferredLocale: 'pt_br',
        }],
        [{
            preferredLocale: 'pt_BR',
        }],
        [{
            preferredLocale: 'pt-br',
        }],
        [{
            preferredLocale: 'pt-BR',
        }],
        [{
            preferredLocale: 'abc_cde',
        }],
        [{
            attributes: {foo: 'bar'},
        }],
        [{
            timeout: 1,
            attributes: {foo: 'bar'},
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            fetchOptionsSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    test.each([
        [
            {timeout: -1},
            'Expected a value greater than or equal to 0 at path \'/timeout\', actual -1.',
        ],
        [
            {timeout: 1.2},
            'Expected value of type integer at path \'/timeout\', actual number.',
        ],
        [
            {version: 'foo'},
            'Invalid format at path \'/version\'.',
        ],
        [
            {version: 0},
            'Expected a value greater than or equal to 1 at path \'/version\', actual 0.',
        ],
        [
            {preferredLocale: 'fooo'},
            'Invalid format at path \'/preferredLocale\'.',
        ],
        [
            {preferredLocale: 'foo-baar'},
            'Invalid format at path \'/preferredLocale\'.',
        ],
        [
            {preferredLocale: 'foo_baar'},
            'Invalid format at path \'/preferredLocale\'.',
        ],
        [
            {attributes: 0},
            'Expected a JSON object at path \'/attributes\', actual integer.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            fetchOptionsSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
