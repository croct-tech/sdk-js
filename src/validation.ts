function formatPath(path: string[]) : string {
    return '/' + path.join('/');
}

function describe(value: any) : string {
    if (value === null) {
        return 'null';
    }

    if (Array.isArray(value)) {
        return 'array';
    }

    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'integer' : 'number';
    }

    if (typeof value === 'object') {
        return value.constructor ? value.constructor.name : 'object';
    }

    return name;
}

export class Violation extends Error {
    public readonly path: string[];
    public readonly params: {[key: string]: any};

    constructor(message: string, path: string[], params: {[p: string]: any }) {
        super(message);
        this.path = path;
        this.params = params;
    }
}

export interface Schema {
    validate(value: any, path?: string[]) : void;
}

export class AnyType implements Schema {
    validate(value: any, path: string[]): void {
    }
}

const FORMAT = {
    uuid: /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/,
    date: /^(\d\d\d\d)-(\d\d)-(\d\d)$/,
    url: /^(?:(?:http[s\u017F]?|ftp):\/\/)(?:(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+(?::(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?@)?(?:(?!10(?:\.[0-9]{1,3}){3})(?!127(?:\.[0-9]{1,3}){3})(?!169\.254(?:\.[0-9]{1,3}){2})(?!192\.168(?:\.[0-9]{1,3}){2})(?!172\.(?:1[6-9]|2[0-9]|3[01])(?:\.[0-9]{1,3}){2})(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])(?:\.(?:1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])){2}(?:\.(?:[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|25[0-4]))|(?:(?:(?:[0-9KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-?)*(?:[0-9KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)(?:\.(?:(?:[0-9KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-?)*(?:[0-9KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)*(?:\.(?:(?:[KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]){2,})))(?::[0-9]{2,5})?(?:\/(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?$/i,
    currency: /^AED|AFN|ALL|AMD|ANG|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BGN|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HRK|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLL|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VES|VND|VUV|WST|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWL$/
};

type StringSchema = {
    minLength: number,
    maxLength: number,
    enumeration: string[]
    pattern?: RegExp,
    format?: keyof typeof FORMAT
}

export class StringType implements Schema {
    private readonly schema: StringSchema;

    constructor(schema: Partial<StringSchema>) {
        this.schema = {
            minLength: -1,
            maxLength: -1,
            enumeration: [],
            ...schema
        };
    }

    validate(value: any, path: string[]): void {
        if (typeof value !== 'string') {
            throw new Violation(
                `Expected value of type string at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'string'}
            );
        }

        const {minLength, maxLength} = this.schema;

        if (minLength >= 0 && minLength > value.length) {
            throw new Violation(
                `Expected ${minLength === maxLength ? 'exactly' : 'at least'} ` +
                `${minLength} ${minLength === 1 ? 'character' : 'characters'} ` +
                `at path '${formatPath(path)}', actual ${value.length}.`,
                path,
                {limit: minLength}
            );
        }

        if (maxLength >= 0 && maxLength < value.length) {
            throw new Violation(
                `Expected ${minLength === maxLength ? 'exactly' : 'at most'} ` +
                `${maxLength} ${maxLength === 1 ? 'character' : 'characters'} ` +
                `at path '${formatPath(path)}', actual ${value.length}.`,
                path,
                {limit: maxLength}
            );
        }

        const {enumeration} = this.schema;

        if (enumeration.length > 0 && enumeration.indexOf(value) < 0) {
            throw new Violation(
                `Unexpected value at path '${formatPath(path)}', expecting ` +
                `'${enumeration.length === 1 
                    ? enumeration[0] 
                    : enumeration.slice(0, -1).join("', '") + "' or '" + enumeration.slice(-1)}', ` +
                `found '${value}'.`,
                path,
                {enumeration: enumeration}
            );
        }

        const {format, pattern} = this.schema;

        if (format !== undefined && !FORMAT[format].test(value)) {
            throw new Violation(
                `Invalid ${format} format at path '${formatPath(path)}'.`,
                path,
                {format: format}
            );
        }

        if (pattern !== undefined && !pattern.test(value)) {
            throw new Violation(
                `Invalid format at path '${formatPath(path)}'.`,
                path,
                {pattern: pattern}
            );
        }
    }
}

type NumberSchema = {
    integer: boolean,
    minimum: number,
    maximum: number
}

export class NumberType implements Schema {
    private readonly schema: NumberSchema;

    constructor(schema: Partial<NumberSchema>) {
        this.schema = {
            integer: false,
            minimum: Number.NEGATIVE_INFINITY,
            maximum: Number.POSITIVE_INFINITY,
            ...schema
        };
    }

    validate(value: any, path: string[] = []): void {
        if (typeof value !== 'number' || (this.schema.integer && !Number.isInteger(value))) {
            const type = this.schema.integer ? 'integer' : 'number';

            throw new Violation(
                `Expected value of type ${type} at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: type}
            );
        }

        if (value < this.schema.minimum) {
            throw new Violation(
                `Expected a value greater than or equal to ${this.schema.minimum} ` +
                `at path '${formatPath(path)}', actual ${value}.`,
                path,
                {limit: this.schema.minimum}
            );
        }

        if (value > this.schema.maximum) {
            throw new Violation(
                `Expected a value less than or equal to ${this.schema.maximum} ` +
                `at path '${formatPath(path)}', actual ${value}.`,
                path,
                {limit: this.schema.maximum}
            );
        }

    }
}

export class BooleanType implements Schema {
    validate(value: any, path: string[] = []): void {
        if (typeof value !== 'boolean') {
            throw new Violation(
                `Expected value of type boolean at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'boolean'}
            );
        }
    }
}

type ArraySchema = {
    minItems: number,
    maxItems: number,
    items?: Schema
}

export class ArrayType implements Schema {
    private readonly schema: ArraySchema;

    constructor(schema: Partial<ArraySchema>) {
        this.schema = {
            minItems: -1,
            maxItems: -1,
            ...schema
        };
    }

    validate(value: any, path: string[] = []): void {
        if (!Array.isArray(value)) {
            throw new Violation(
                `Expected value of type array at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'string'}
            );
        }

        const {minItems, maxItems} = this.schema;
        const length = value.length;

        if (minItems >= 0 && minItems > length) {
            throw new Violation(
                `Expected ${minItems === maxItems ? 'exactly' : 'at least'} ` +
                `${minItems} ${minItems === 1 ? 'item' : 'items'} ` +
                `at path '${formatPath(path)}', actual ${length}.`,
                path,
                {limit: minItems}
            );
        }

        if (maxItems >= 0 && maxItems < length) {
            throw new Violation(
                `Expected ${minItems === maxItems ? 'exactly' : 'at most'} ` +
                `${maxItems} ${maxItems === 1 ? 'item' : 'items'} ` +
                `at path '${formatPath(path)}', actual ${length}.`,
                path,
                {limit: maxItems}
            );
        }

        if (this.schema.items === undefined) {
            return;
        }

        for (let index = 0; index < length; index++) {
            this.schema.items.validate(value[index], path.concat([index.toString()]));
        }
    }
}

type ObjectSchema = {
    properties: {[key: string]: Schema},
    additionalProperties: false | Schema
    propertyNames: Schema
    required: string[],
    minProperties: number,
    maxProperties: number
}

export class ObjectType implements Schema {
    private readonly schema: ObjectSchema;

    constructor(schema: Partial<ObjectSchema>) {
        this.schema = {
            properties: {},
            required: [],
            additionalProperties: false,
            propertyNames: new AnyType(),
            minProperties: -1,
            maxProperties: -1,
            ...schema
        };
    }

    validate(value: any, path: string[] = []): void {
        if (typeof value !== 'object' || value === null || value.constructor !== Object) {
            throw new Violation(
                `Expected value of type object at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'object'}
            );
        }

        const entries = Object.entries(value);

        const {minProperties, maxProperties} = this.schema;

        if (minProperties >= 0 && minProperties > entries.length) {
            throw new Violation(
                `Expected ${minProperties === maxProperties ? 'exactly' : 'at least'} ` +
                `${minProperties} ${minProperties === 1 ? 'entry' : 'entries'} ` +
                `at path '${formatPath(path)}', actual ${entries.length}.`,
                path,
                {limit: minProperties}
            );
        }

        if (maxProperties >= 0 && maxProperties < entries.length) {
            throw new Violation(
                `Expected ${minProperties === maxProperties ? 'exactly' : 'at most'} ` +
                `${maxProperties} ${maxProperties === 1 ? 'entry' : 'entries'} ` +
                `at path '${formatPath(path)}', actual ${entries.length}.`,
                path,
                {limit: maxProperties}
            );
        }

        for (const property of this.schema.required) {
            if (!value.hasOwnProperty(property)) {
                throw new Violation(
                    `Missing property '${formatPath(path.concat([property]))}'.`,
                    path,
                    {required: property}
                );
            }
        }

        for (const [name, value] of entries) {
            const propertyPath = path.concat([name]);

            this.schema.propertyNames.validate(name, propertyPath);

            const propertyRule = this.schema.properties[name];

            if (propertyRule !== undefined) {
                propertyRule.validate(value, propertyPath);

                continue;
            }

            if (this.schema.additionalProperties === false) {
                throw new Violation(
                    `Unknown property '${formatPath(propertyPath)}'.`,
                    propertyPath,
                    {additionalProperty: name}
                );
            }

            this.schema.additionalProperties.validate(value, propertyPath);
        }
    }
}