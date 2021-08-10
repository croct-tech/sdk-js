import {StringType} from '../validation';

export const attributeNameSchema = new StringType({
    maxLength: 50,
    format: 'identifier',
});
