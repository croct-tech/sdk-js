import {ObjectType, NumberType, JsonObjectType} from '../validation';

export const optionsSchema = new ObjectType({
    properties: {
        timeout: new NumberType({
            integer: true,
            minimum: 0,
        }),
        attributes: new JsonObjectType(),
    },
});
