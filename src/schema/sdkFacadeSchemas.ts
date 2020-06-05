import ObjectType from '../validation/objectType';
import StringType from '../validation/stringType';
import BooleanType from '../validation/booleanType';
import {tokenScopeSchema} from './contextSchemas';
import {eventMetadataSchema} from './sdkSchemas';
import {loggerSchema} from './loggerSchema';

export const configurationSchema = new ObjectType({
    required: ['appId'],
    properties: {
        appId: new StringType({
            format: 'uuid',
        }),
        cid: new StringType({
            pattern: /^[0-9a-f]{32}$/i,
        }),
        tokenScope: tokenScopeSchema,
        debug: new BooleanType(),
        track: new BooleanType(),
        logger: loggerSchema,
        eventMetadata: eventMetadataSchema,
        userId: new StringType({
            minLength: 1,
        }),
        token: new StringType({
            pattern: /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
        }),
        trackerEndpointUrl: new StringType({
            format: 'url',
        }),
        evaluationEndpointUrl: new StringType({
            format: 'url',
        }),
        bootstrapEndpointUrl: new StringType({
            format: 'url',
        }),
    },
});
