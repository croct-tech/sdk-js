import {ObjectType, NumberType, StringType} from '../../src/validation';

describe('An object type', () => {
    test('should provide the allowed type', () => {
        expect(new ObjectType().getTypes()).toEqual(['object']);
    });

    test.each([
        [null, false],
        ['foo', false],
        [true, false],
        [1, false],
        [1.23, false],
        [['foo', 'bar'], false],
        [{foo: 'bar'}, true],
        [new Object('foo'), false],
        [new Object(), true],
    ])('should determine whether the type of a given value is valid', (value: any, expected: boolean) => {
        expect(new ObjectType().isValidType(value)).toBe(expected);
    });

    test.each([
        [
            {foo: 1},
            new ObjectType({properties: {foo: new NumberType({})}}),
        ],
        [
            {foo: 2},
            new ObjectType({properties: {foo: new NumberType({})}, required: ['foo']}),
        ],
        [
            {foo: 3},
            new ObjectType({properties: {foo: new NumberType({})}, additionalProperties: false}),
        ],
        [
            {foo: 4, bar: 5},
            new ObjectType({additionalProperties: new NumberType({}), propertyNames: new StringType({minLength: 3})}),
        ],
        [
            {foo: 4, bar: 5},
            new ObjectType({additionalProperties: true}),
        ],
        [
            {foo: 6},
            new ObjectType({additionalProperties: new NumberType({}), minProperties: 1}),
        ],
        [
            {foo: 7},
            new ObjectType({additionalProperties: new NumberType({}), maxProperties: 1}),
        ],
        [
            {type: 'foo', foo: 1},
            new ObjectType({
                properties: {
                    type: new StringType({enumeration: ['foo', 'bar']}),
                },
                additionalProperties: true,
                subtypes: {
                    discriminator: 'type',
                    schemas: {
                        foo: new ObjectType({properties: {foo: new NumberType()}}),
                        bar: new ObjectType({properties: {bar: new NumberType()}}),
                    },
                },
            }),
        ],
        [
            {type: 'foo'},
            new ObjectType({
                properties: {
                    type: new StringType({enumeration: ['foo', 'bar']}),
                },
                additionalProperties: true,
                subtypes: {
                    discriminator: 'type',
                    schemas: {
                        foo: new ObjectType({properties: {bar: new NumberType()}}),
                    },
                },
            }),
        ],
        [
            (): void => {
                // function
            },
            new ObjectType({type: Function}),
        ],
        [
            /regex/,
            new ObjectType({type: RegExp}),
        ],
    ])('should allow %s with %o', (value: any, type: ObjectType) => {
        function validate(): void {
            type.validate(value);
        }

        expect(validate).not.toThrow();
    });

    test.each([
        [
            null,
            new ObjectType({}),
            "Expected value of type object at path '/', actual null.",
        ],
        [
            'foo',
            new ObjectType({}),
            "Expected value of type object at path '/', actual string.",
        ],
        [
            1,
            new ObjectType({}),
            "Expected value of type object at path '/', actual integer.",
        ],
        [
            true,
            new ObjectType({}),
            "Expected value of type object at path '/', actual boolean.",
        ],
        [
            {foo: 'bar'},
            new ObjectType({properties: {foo: new NumberType({})}}),
            "Expected value of type number at path '/foo', actual string.",
        ],
        [
            {bar: 1},
            new ObjectType({properties: {foo: new NumberType({})}, required: ['foo']}),
            "Missing property '/foo'.",
        ],
        [
            {foo: 1, bar: 2},
            new ObjectType({properties: {foo: new NumberType({})}, additionalProperties: false}),
            "Unknown property '/bar'.",
        ],
        [
            {foo: '1', bar: 2},
            new ObjectType({properties: {foo: new NumberType({})}, additionalProperties: true}),
            "Expected value of type number at path '/foo', actual string.",
        ],
        [
            {bar: 'foo'},
            new ObjectType({additionalProperties: new NumberType({}), propertyNames: new StringType({minLength: 3})}),
            "Expected value of type number at path '/bar', actual string.",
        ],
        [
            {foobar: 1},
            new ObjectType({additionalProperties: new NumberType({}), propertyNames: new StringType({maxLength: 3})}),
            "Expected at most 3 characters at path '/foobar', actual 6.",
        ],
        [
            {},
            new ObjectType({additionalProperties: new NumberType({}), minProperties: 1}),
            "Expected at least 1 entry at path '/', actual 0.",
        ],
        [
            {foo: 3, bar: 4},
            new ObjectType({additionalProperties: new NumberType({}), maxProperties: 1}),
            "Expected at most 1 entry at path '/', actual 2.",
        ],
        [
            {foo: 5, bar: 6},
            new ObjectType({additionalProperties: new NumberType({}), minProperties: 1, maxProperties: 1}),
            "Expected exactly 1 entry at path '/', actual 2.",
        ],
        [
            {type: 'foo', foo: '1'},
            new ObjectType({
                properties: {
                    type: new StringType({enumeration: ['foo', 'bar']}),
                },
                additionalProperties: true,
                subtypes: {
                    discriminator: 'type',
                    schemas: {
                        foo: new ObjectType({properties: {foo: new NumberType()}}),
                        bar: new ObjectType({properties: {bar: new NumberType()}}),
                    },
                },
            }),
            "Expected value of type number at path '/foo', actual string.",
        ],
        [
            {type: 'bar', bar: '1'},
            new ObjectType({
                properties: {
                    type: new StringType({enumeration: ['foo', 'bar']}),
                },
                additionalProperties: true,
                subtypes: {
                    discriminator: 'type',
                    schemas: {
                        foo: new ObjectType({properties: {foo: new NumberType()}}),
                        bar: new ObjectType({properties: {bar: new NumberType()}}),
                    },
                },
            }),
            "Expected value of type number at path '/bar', actual string.",
        ],
        [
            {type: 'foo'},
            new ObjectType({
                properties: {
                    type: new StringType({enumeration: ['foo', 'bar']}),
                },
                additionalProperties: true,
                subtypes: {
                    discriminator: 'type',
                    schemas: {
                        foo: new ObjectType({
                            required: ['foo'],
                            properties: {foo: new NumberType()},
                        }),
                        bar: new ObjectType({
                            required: ['bar'],
                            properties: {bar: new NumberType()},
                        }),
                    },
                },
            }),
            "Missing property '/foo'.",
        ],
        [
            {type: 'foo', foo: 1},
            new ObjectType({
                properties: {
                    type: new StringType({enumeration: ['foo', 'bar']}),
                },
                additionalProperties: false,
                subtypes: {
                    discriminator: 'type',
                    schemas: {
                        foo: new ObjectType({properties: {foo: new NumberType()}}),
                    },
                },
            }),
            "Unknown property '/foo'.",
        ],
        [
            1,
            new ObjectType({type: Function}),
            "Expected value of type Function at path '/', actual integer.",
        ],
        [
            null,
            new ObjectType({type: RegExp}),
            "Expected value of type RegExp at path '/', actual null.",
        ],
    ])('should not allow %s with %o', (
        value: any,
        type: ObjectType,
        message: string,
    ) => {
        function validate(): void {
            type.validate(value);
        }

        expect(validate).toThrow(new Error(message));
    });
});
