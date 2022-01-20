import {StringType} from '../../src/validation';

describe('A string type', () => {
    test('should provide the allowed type', () => {
        expect(new StringType().getTypes()).toEqual(['string']);
    });

    test.each([
        [null, false],
        ['foo', true],
        [true, false],
        [1, false],
        [1.23, false],
        [['foo', 'bar'], false],
        [{foo: 'bar'}, false],
        [new Object('foo'), false],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new StringType().isValidType(value)).toBe(expected);
    });

    test.each([
        ['bd70aced-f238-4a06-b49d-0c96fe10c4f8', 'uuid'],
        ['2015-08-31', 'date'],
        ['http://www.foo.com.br', 'url'],
        ['foo://example.com:3000/path?here=there#fragment', 'uri'],
        ['_', 'identifier'],
        ['a', 'identifier'],
        ['A', 'identifier'],
        ['a_', 'identifier'],
        ['a1', 'identifier'],
        ['aa', 'identifier'],
        ['aA', 'identifier'],
        ['.', 'pointer'],
        ['a', 'pointer'],
        ['a0', 'pointer'],
        ['a.b', 'pointer'],
        ['a[0].b', 'pointer'],
        ['ab12_[0].cd34_', 'pointer'],
        ['abc[0].dfg[1].h', 'pointer'],
        ['abc[0].dfg[1]', 'pointer'],
        ['abc[0][1].foo', 'pointer'],
        ['_[0][1]._', 'pointer'],
        ['[0][1].foo', 'pointer'],
        ['_._', 'pointer'],
    ])('should allow %s with format %s', (value: string, format: string) => {
        function validate(): void {
            new StringType({format: format}).validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        ['bd70acedf2384a06b49d0c96fe10c4f8', 'uuid'],
        ['bd70aced-zzzz-4a06-b49d-0c96fe10c4f8', 'uuid'],
        ['20150831', 'date'],
        ['2015-08', 'date'],
        ['08-31', 'date'],
        ['foo.com', 'url'],
        ['<', 'url'],
        ['', 'identifier'],
        ['@foo', 'identifier'],
        ['a@#$', 'identifier'],
        ['', 'pointer'],
        ['..', 'pointer'],
        ['0', 'pointer'],
        ['0a', 'pointer'],
        ['a.', 'pointer'],
        ['.a', 'pointer'],
        ['a[].b', 'pointer'],
        ['123', 'pointer'],
        ['123[0].cd34_', 'pointer'],
        ['.h', 'pointer'],
        ['[]', 'pointer'],
        ['[][]', 'pointer'],
        ['[0].1', 'pointer'],
        ['1.a', 'pointer'],
        ['a.1', 'pointer'],
        ['abc[a]', 'pointer'],
        ['abc[-1]', 'pointer'],
        ['@#$', 'pointer'],
        ['[0', 'pointer'],
        ['0]', 'pointer'],
    ])('should not allow %s with format %s', (value: string, format: string) => {
        function validate(): void {
            new StringType({format: format}).validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(`Invalid ${format} format at path '/'.`);
    });

    test.each([
        ['foo', new StringType({minLength: 2})],
        ['foo', new StringType({maxLength: 4})],
        ['foo', new StringType({enumeration: ['foo']})],
        ['foo', new StringType({pattern: /fo+/})],
        ['bd70aced-f238-4a06-b49d-0c96fe10c4f8', new StringType({format: 'uuid'})],
        ['2015-08-31', new StringType({format: 'date'})],
        ['http://www.foo.com.br', new StringType({format: 'url'})],
        ['foo://example.com:3000/path?key=value#fragment', new StringType({format: 'uri'})],
    ])('should allow %s with %o', (value: string, type: StringType) => {
        function validate(): void {
            type.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [null, new StringType({}), 'Expected value of type string at path \'/\', actual null.'],
        [1, new StringType({}), 'Expected value of type string at path \'/\', actual integer.'],
        [[], new StringType({}), 'Expected value of type string at path \'/\', actual array.'],
        [{}, new StringType({}), 'Expected value of type string at path \'/\', actual Object.'],
        ['a', new StringType({minLength: 2}), "Expected at least 2 characters at path '/', actual 1."],
        ['abc', new StringType({maxLength: 2}), "Expected at most 2 characters at path '/', actual 3."],
        ['abc', new StringType({minLength: 2, maxLength: 2}), "Expected exactly 2 characters at path '/', actual 3."],
        [
            'c',
            new StringType({enumeration: ['a', 'b']}),
            "Unexpected value at path '/', expecting 'a' or 'b', found 'c'.",
        ],
        ['bar', new StringType({pattern: /fo+/}), "Invalid format at path '/'."],
        ['foo', new StringType({format: 'url'}), "Invalid url format at path '/'."],
    ])('should not allow %s with %o', (value: any, type: StringType, message: string) => {
        function validate(): void {
            type.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
