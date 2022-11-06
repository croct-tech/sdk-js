import {ObjectType, StringType, BooleanType, NumberType, FunctionType} from '../validation';
import {tokenScopeSchema} from './contextSchemas';
import {loggerSchema} from './loggerSchema';

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

export const sdkConfigurationSchema = new ObjectType({
    required: ['appId'],
    properties: {
        appId: new StringType({
            format: 'uuid',
        }),
        cid: new StringType({
            pattern: /^[0-9a-f]{32}$/i,
        }),
        tokenScope: tokenScopeSchema,
        trackerEndpointUrl: new StringType({
            format: 'url',
        }),
        evaluationEndpointUrl: new StringType({
            format: 'url',
        }),
        contentEndpointUrl: new StringType({
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
        test: new BooleanType(),
        logger: loggerSchema,
        urlSanitizer: new FunctionType(),
        eventMetadata: eventMetadataSchema,
    },
});
