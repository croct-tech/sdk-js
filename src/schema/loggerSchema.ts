import ObjectType from '../validation/objectType';
import FunctionType from '../validation/functionType';

export const loggerSchema = new ObjectType({
    required: ['debug', 'info', 'warn', 'error'],
    properties: {
        debug: new FunctionType(),
        info: new FunctionType(),
        warn: new FunctionType(),
        error: new FunctionType(),
    },
});
