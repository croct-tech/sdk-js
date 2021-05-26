import {ObjectType, FunctionType} from '../validation';

export const loggerSchema = new ObjectType({
    required: ['debug', 'info', 'warn', 'error'],
    additionalProperties: true,
    properties: {
        debug: new FunctionType(),
        info: new FunctionType(),
        warn: new FunctionType(),
        error: new FunctionType(),
    },
});
