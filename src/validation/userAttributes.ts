import {Validator, Violation} from '../validation';
import {UserAttributes} from '../command';

export function isValid(data: any) : data is UserAttributes {
    return validate(data) === null;
}

export const validate: Validator = function(data: any) : Violation | null {
    if (data === null || typeof data !== 'object') {
        return {
            path: '',
            message: 'must be a map of name-value pairs'
        };
    }

    for (const [name, value] of Object.entries(data)) {
        switch (name) {
            case 'email':
                if (typeof value !== 'string') {
                    return {
                        path: name,
                        message: 'must be of type string'
                    };
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return {
                        path: name,
                        message: 'must be a well-formed email address'
                    };
                }
                break;

            case 'firstName':
                if (typeof value !== 'string') {
                    return {
                        path: name,
                        message: 'must be of type string'
                    };
                }
                break;

            case 'gender':
                if (typeof value !== 'string' || !['neutral', 'male', 'female'].includes(value)) {
                    return {
                        path: name,
                        message: 'must be either \'neutral\', \'male\' or \'female\''
                    };
                }
                break;

            case 'custom':
                if (typeof value !== 'object' || value === null || value.constructor !== Object) {
                    return {
                        path: name,
                        message: 'must be a map of name-value pairs'
                    };
                }

                const isValidValue = function(value: any) : boolean {
                    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
                };

                for (const [attributeName, attributeValue] of Object.entries(value)) {
                    if (!/^[A-Za-z][A-Za-z0-9_]+$/.test(attributeName)) {
                        return {
                            path: `${name}.${attributeName}`,
                            message: 'must start with a letter, followed by any other letter ' +
                                'digit or underscore'
                        };
                    }

                    if (Array.isArray(attributeValue)) {
                        const index = attributeValue.find(isValidValue);

                        if (index >= 0) {
                            return {
                                path: `${name}.${attributeName}.${index}`,
                                message: 'must be of type null, string, number or boolean'
                            };
                        }
                    } else if (!isValidValue(attributeValue)) {
                        return {
                            path: `${name}.${attributeName}`,
                            message: 'must be of type null, string, number, boolean or array'
                        };
                    }
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