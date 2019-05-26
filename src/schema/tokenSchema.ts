import ObjectType from '../validation/objectType';
import StringType from '../validation/stringType';
import NumberType from '../validation/numberType';

export default new ObjectType({
    required: ['headers', 'claims'],
    properties: {
        headers: new ObjectType({
            required: ['typ', 'alg', 'appId'],
            properties: {
                typ: new StringType(),
                alg: new StringType(),
                kid: new StringType(),
                appId: new StringType({
                    format: 'uuid',
                }),
            },
        }),
        claims: new ObjectType({
            required: ['iss', 'aud', 'iat'],
            properties: {
                iss: new StringType(),
                aud: new StringType(),
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
        }),
        signature: new StringType(),
    },
});
