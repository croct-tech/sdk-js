import {StringType} from '../validation';

export const tokenScopeSchema = new StringType({
    enumeration: ['global', 'contextual', 'isolated'],
});
