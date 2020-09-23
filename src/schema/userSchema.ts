import StringType from '../validation/stringType';
import ObjectType from '../validation/objectType';
import UnionType from '../validation/unionType';
import BooleanType from '../validation/booleanType';
import NullType from '../validation/nullType';
import NumberType from '../validation/numberType';
import ArrayType from '../validation/arrayType';

export const userProfileSchema = new ObjectType({
    properties: {
        firstName: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        lastName: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        birthDate: new StringType({
            format: 'date',
        }),
        gender: new StringType({
            enumeration: ['male', 'female', 'neutral', 'unknown'],
        }),
        email: new StringType({
            minLength: 1,
            maxLength: 254,
        }),
        alternateEmail: new StringType({
            minLength: 1,
            maxLength: 254,
        }),
        phone: new StringType({
            minLength: 1,
            maxLength: 30,
        }),
        alternatePhone: new StringType({
            minLength: 1,
            maxLength: 30,
        }),
        address: new ObjectType({
            properties: {
                street: new StringType({
                    minLength: 1,
                    maxLength: 100,
                }),
                district: new StringType({
                    minLength: 1,
                    maxLength: 100,
                }),
                city: new StringType({
                    minLength: 1,
                    maxLength: 100,
                }),
                region: new StringType({
                    minLength: 1,
                    maxLength: 100,
                }),
                country: new StringType({
                    minLength: 1,
                    maxLength: 100,
                }),
                postalCode: new StringType({
                    minLength: 1,
                    maxLength: 20,
                }),
            },
        }),
        avatar: new StringType({
            maxLength: 500,
            format: 'url',
        }),
        company: new StringType({
            minLength: 1,
            maxLength: 200,
        }),
        companyUrl: new StringType({
            maxLength: 200,
            format: 'url',
        }),
        jobTitle: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        interests: new ArrayType({
            maxItems: 30,
            items: new StringType({
                minLength: 1,
                maxLength: 30,
            }),
        }),
        activities: new ArrayType({
            maxItems: 30,
            items: new StringType({
                minLength: 1,
                maxLength: 30,
            }),
        }),
        custom: new ObjectType({
            propertyNames: new StringType({
                maxLength: 50,
                format: 'identifier',
            }),
            maxProperties: 10,
            additionalProperties: new UnionType(
                new BooleanType(),
                new NullType(),
                new NumberType(),
                new StringType({
                    maxLength: 100,
                }),
                new ArrayType({
                    maxItems: 10,
                    items: new UnionType(
                        new BooleanType(),
                        new NullType(),
                        new NumberType(),
                        new StringType({
                            maxLength: 100,
                        }),
                        new ArrayType({
                            maxItems: 10,
                            items: new UnionType(
                                new BooleanType(),
                                new NullType(),
                                new NumberType(),
                                new StringType({
                                    maxLength: 100,
                                }),
                            ),
                        }),
                        new ObjectType({
                            propertyNames: new StringType({
                                maxLength: 50,
                                format: 'identifier',
                            }),
                            maxProperties: 10,
                            additionalProperties: new UnionType(
                                new BooleanType(),
                                new NullType(),
                                new NumberType(),
                                new StringType({
                                    maxLength: 100,
                                }),
                            ),
                        }),
                    ),
                }),
                new ObjectType({
                    propertyNames: new StringType({
                        maxLength: 50,
                        format: 'identifier',
                    }),
                    maxProperties: 10,
                    additionalProperties: new UnionType(
                        new BooleanType(),
                        new NullType(),
                        new NumberType(),
                        new StringType({
                            maxLength: 100,
                        }),
                        new ArrayType({
                            maxItems: 10,
                            items: new UnionType(
                                new BooleanType(),
                                new NullType(),
                                new NumberType(),
                                new StringType({
                                    maxLength: 100,
                                }),
                            ),
                        }),
                        new ObjectType({
                            propertyNames: new StringType({
                                maxLength: 50,
                                format: 'identifier',
                            }),
                            maxProperties: 10,
                            additionalProperties: new UnionType(
                                new BooleanType(),
                                new NullType(),
                                new NumberType(),
                                new StringType({
                                    maxLength: 100,
                                }),
                            ),
                        }),
                    ),
                }),
            ),
        }),
    },
});
