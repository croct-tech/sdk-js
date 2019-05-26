import StringType from '../validation/stringType';

export const tokenScopeSchema = new StringType({
    enumeration: ['global', 'contextual', 'isolated'],
});
