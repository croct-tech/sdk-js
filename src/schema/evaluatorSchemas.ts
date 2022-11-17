import {ObjectType, NumberType, JsonObjectType} from '../validation';

export const evaluationOptionsSchema = new ObjectType({
    properties: {
        timeout: new NumberType({
            integer: true,
            minimum: 0,
        }),
        attributes: new JsonObjectType(),
    },
});
