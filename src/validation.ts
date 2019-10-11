import {ErrorObject} from 'ajv';

export function formatError(error: ErrorObject) : string {
    console.log(error);

    switch (error.keyword) {
        case 'required':
            return `Missing property '${error.dataPath}/${(error.params as any).missingProperty}'.`;

        case 'additionalProperties':
            return `Unrecognized property '${(error.params as any).additionalProperty}'.`;

        case 'enum':
            return `Unexpected value for '${error.dataPath}', expecting ${formatArray((error.params as any).allowedValues)}.`;

        default:
            let dataPath = error.dataPath;

            if (dataPath !== null && dataPath.indexOf('.') === 0) {
                dataPath = dataPath.substring(1);
            }

           return `Property '${dataPath}' ${error.message}.`;
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