import ObjectType from '../validation/objectType';
import StringType from '../validation/stringType';
import BooleanType from '../validation/booleanType';
import {tokenScopeSchema} from './contextSchemas';
import MixedSchema from '../validation/mixedSchema';
import NumberType from '../validation/numberType';

export const eventMetadataSchema = new ObjectType({
    maxProperties: 5,
    propertyNames: new StringType({
        minLength: 1,
        maxLength: 20,
        format: 'identifier',
    }),
    additionalProperties: new StringType({
        maxLength: 300,
    }),
});

export const configurationSchema = new ObjectType({
    required: ['appId'],
    properties: {
        appId: new StringType({
            format: 'uuid',
        }),
        tokenScope: tokenScopeSchema,
        trackerEndpointUrl: new StringType({
            format: 'url',
        }),
        evaluationEndpointUrl: new StringType({
            format: 'url',
        }),
        bootstrapEndpointUrl: new StringType({
            format: 'url',
        }),
        beaconQueueSize: new NumberType({
            minimum: 0,
            integer: true,
        }),
        debug: new BooleanType(),
        logger: new MixedSchema(),
        eventMetadata: eventMetadataSchema,
    },
});
