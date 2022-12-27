import {ObjectType, StringType, BooleanType, UnionType, NullType, FunctionType} from '../validation';
import {tokenScopeSchema} from './contextSchemas';
import {eventMetadataSchema} from './sdkSchemas';
import {loggerSchema} from './loggerSchema';

export const sdkFacadeConfigurationSchema = new ObjectType({
    required: ['appId'],
    properties: {
        appId: new StringType({
            format: 'uuid',
        }),
        clientId: new StringType({
            pattern: /^[0-9a-f]{32}$/i,
        }),
        tokenScope: tokenScopeSchema,
        debug: new BooleanType(),
        test: new BooleanType(),
        track: new BooleanType(),
        logger: loggerSchema,
        urlSanitizer: new FunctionType(),
        eventMetadata: eventMetadataSchema,
        userId: new StringType({
            minLength: 1,
        }),
        token: new UnionType(
            new StringType({
                pattern: /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
            }),
            new NullType(),
        ),
        baseEndpointUrl: new StringType({
            format: 'url',
        }),
        cidAssignerEndpointUrl: new StringType({
            format: 'url',
        }),
    },
});
