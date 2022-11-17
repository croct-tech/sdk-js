import {ObjectType, StringType, NumberType, UnionType, ArrayType} from '../validation';

export const tokenSchema = new ObjectType({
    required: ['headers', 'payload'],
    properties: {
        headers: new ObjectType({
            required: ['typ', 'alg'],
            properties: {
                typ: new StringType(),
                alg: new StringType(),
                kid: new StringType(),
                appId: new StringType({
                    format: 'uuid',
                }),
            },
        }),
        payload: new ObjectType({
            required: ['iss', 'aud', 'iat'],
            properties: {
                iss: new StringType(),
                aud: new UnionType(
                    new StringType(),
                    new ArrayType({items: new StringType()}),
                ),
                iat: new NumberType({
                    minimum: 0,
                }),
                sub: new StringType({
                    minLength: 1,
                }),
                exp: new NumberType({
                    minimum: 0,
                }),
                jti: new StringType({
                    format: 'uuid',
                }),
            },
            additionalProperties: true,
        }),
        signature: new StringType(),
    },
});
