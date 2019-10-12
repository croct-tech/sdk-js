import {BooleanType, ObjectType, StringType} from './validation';

export var configurationSchema = new ObjectType({
    additionalProperties: false,
    required: ['apiKey'],
    properties: {
        apiKey: new StringType({
            pattern: /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/
        }),
        storageNamespace: new StringType({
            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/
        }),
        tokenScope: new StringType({
            enumeration: [
                'global',
                'contextual',
                'isolated'
            ]
        }),
        debug: new BooleanType(),
        track: new BooleanType(),
    }
});
