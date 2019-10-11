import {ErrorObject} from 'ajv';

export function formatError(error: ErrorObject) : string {
    console.log(error);

    switch (error.keyword) {
        case 'required':
            return `Missing property ${error.dataPath}/${(error.params as any).missingProperty}.`;

        case 'enum':
            return `Unexpected value for ${error.dataPath}, expecting ${formatArray((error.params as any).allowedValues)}.`;

        case 'additionalProperties':
            return `Unrecognized property ${error.dataPath}/${(error.params as any).additionalProperty}.`;

        case 'minLength':
            const minLength = (error.params as any).limit;

            if (minLength === 1) {
                return `Property ${error.dataPath} cannot be empty.`;
            }

            return `Property ${error.dataPath} should have ${minLength} characters or more.`;

        case 'maxLength':
            return `Property ${error.dataPath} should have ${(error.params as any).limit} characters or less.`;

        case 'minItems':
            const minItems = (error.params as any).limit;

            if (minItems === 1) {
                return `List ${error.dataPath} cannot be empty.`;
            }

            return `List ${error.dataPath} should have ${minItems} items or more.`;

        case 'maxItems':
            return `List ${error.dataPath} should have ${(error.params as any).limit} items or less.`;

        case 'minProperties':
            const minProperties = (error.params as any).limit;

            if (minProperties === 1) {
                return `Map ${error.dataPath} cannot be empty.`;
            }

            return `Map ${error.dataPath} should have ${minProperties} entries or more.`;

        case 'maxProperties':
            return `Map ${error.dataPath} should have ${(error.params as any).limit} entries or less.`;

        default:
           return `Property ${error.dataPath} ${error.message}.`;
    }
}

function formatArray(arr: string[]) : string {
    switch (arr.length) {
        case 1:
            return `'${arr[0]}'`;

        case 2:
            return "'" + arr.join("' or '") + "'" ;

        default:
            return "'" + arr.slice(0, -1).join("', '") + "' or '" + arr.slice(-1) + "'";
    }
}