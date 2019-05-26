import ObjectType from '../validation/objectType';
import StringType from '../validation/stringType';
import BooleanType from '../validation/booleanType';
import {tokenScopeSchema} from './contextSchemas';
import MixedSchema from '../validation/mixedSchema';
import {eventMetadataSchema} from './sdkSchemas';

export const configurationSchema = new ObjectType({
    required: ['appId'],
    properties: {
        appId: new StringType({
            format: 'uuid',
        }),
        tokenScope: tokenScopeSchema,
        debug: new BooleanType(),
        track: new BooleanType(),
        logger: new MixedSchema(),
        eventMetadata: eventMetadataSchema,
        userId: new StringType({
            minLength: 1,
        }),
        token: new StringType({
            pattern: /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
        }),
    },
});
