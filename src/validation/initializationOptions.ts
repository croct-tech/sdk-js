import {Validator} from '../validation';
import {Options as SdkOptions} from '../sdk';

type Options = SdkOptions & {
    user?: string
}

export function isValid(data: any) : data is Options {
    return validate(data) === null;
}

export const validate: Validator = function(data: any) {
    if (data === null || typeof data !== 'object') {
        return {
            path: '',
            message: 'must be a map of key-value pairs'
        };
    }

    for (const [name, value] of Object.entries(data)) {
        switch (name) {
            case 'storageNamespace':
                if (typeof value !== 'string') {
                    return {
                        path: name,
                        message: 'must be of type string'
                    };
                }
                break;

            case 'tokenScope':
                if (typeof value !== 'string' || !['global', 'contextual', 'isolated'].includes(value)) {
                    return {
                        path: name,
                        message: 'must be either \'contextual\', \'global\' or \'isolated\''
                    };
                }
                break;

            case 'debug':
                if (typeof value !== 'boolean') {
                    return {
                        path: name,
                        message: 'must be of type boolean'
                    };
                }
                break;

            case 'track':
                if (typeof value !== 'boolean') {
                    return {
                        path: name,
                        message: 'must be of type boolean'
                    };
                }
                break;

            default:
                return {
                    path: name,
                    message: 'is unknown'
                };
        }
    }

    return null;
};