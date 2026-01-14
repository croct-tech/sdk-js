import {ObjectType, NumberType, JsonObjectType, StringType, UnionType, BooleanType} from '../validation';

export const fetchOptionsSchema = new ObjectType({
    properties: {
        timeout: new NumberType({
            integer: true,
            minimum: 0,
        }),
        version: new UnionType(
            new StringType({
                pattern: /^\d+$/,
            }),
            new NumberType({
                integer: true,
                minimum: 1,
            }),
        ),
        preferredLocale: new StringType({
            pattern: /^[a-z]{2,3}([-_][a-z]{2,3})?$/i,
        }),
        schema: new BooleanType(),
        attributes: new JsonObjectType(),
    },
});
