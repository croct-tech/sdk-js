import ObjectType from '../validation/objectType';
import NumberType from '../validation/numberType';
import {JsonObjectType} from '../validation/jsonType';

export const optionsSchema = new ObjectType({
    properties: {
        timeout: new NumberType({
            integer: true,
            minimum: 0,
        }),
        attributes: new JsonObjectType(),
    },
});
