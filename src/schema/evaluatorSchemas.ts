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

function createJsonSchema(maximumDepth: number): TypeSchema {
    return new UnionType(
        new NullType(),
        new NumberType(),
        new BooleanType(),
        new StringType({maxLength: 255}),
        ...(maximumDepth > 1
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
    );
}

export const evaluationOptionsSchema = new ObjectType({
    properties: {
        timeout: new NumberType({
            integer: true,
            minimum: 0,
        }),
        attributes: new JsonObjectType({
            propertyNames: new StringType({
                minLength: 1,
                maxLength: 50,
            }),
            properties: createJsonSchema(5),
        }),
    },
});
