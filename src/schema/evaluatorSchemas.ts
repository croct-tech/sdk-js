import {
    ObjectType,
    NumberType,
    JsonObjectType,
    UnionType,
    StringType,
    NullType,
    BooleanType,
    TypeSchema,
    ArrayType,
} from '../validation';

type PrimitiveSchemas = [NullType, NumberType, BooleanType, StringType];

function createJsonSchema(maximumDepth: number): TypeSchema {
    const primitiveSchemas: PrimitiveSchemas = [
        new NullType(),
        new NumberType(),
        new BooleanType(),
        new StringType({maxLength: 255}),
    ];

    const getNestedSchemas = (): [...PrimitiveSchemas, ...TypeSchema[]] => [
        ...primitiveSchemas,
        ...(
            maximumDepth > 1
                ? [
                    new JsonObjectType({
                        propertyNames: new UnionType(
                            new NumberType(),
                            new StringType({
                                minLength: 1,
                                maxLength: 50,
                            }),
                        ),
                        properties: createJsonSchema(maximumDepth - 1),
                    }),
                    new ArrayType({items: createJsonSchema(maximumDepth - 1)}),
                ]
                : []
        ),
    ];

    return new UnionType(...getNestedSchemas());
}

export const evaluationOptionsSchema = new ObjectType({
    properties: {
        timeout: new NumberType({
            integer: true,
            minimum: 0,
        }),
        attributes: new JsonObjectType({
            propertyNames: new UnionType(
                new NumberType(),
                new StringType({
                    minLength: 1,
                    maxLength: 50,
                }),
            ),
            properties: createJsonSchema(5),
        }),
    },
});
