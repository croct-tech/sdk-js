import {TypeSchema, Violation} from './schema';
import {describe, formatPath} from './violation';

export class UnionType implements TypeSchema {
    private readonly schemas: TypeSchema[];

    public constructor(first: TypeSchema, second: TypeSchema, ...others: TypeSchema[]) {
        this.schemas = [first, second, ...others];
    }

    public getTypes(): string[] {
        const types = [];

        for (const schema of this.schemas) {
            for (const type of schema.getTypes()) {
                if (types.indexOf(type) < 0) {
                    types.push(type);
                }
            }
        }

        return types;
    }

    public isValidType(value: unknown): boolean {
        for (const schema of this.schemas) {
            if (schema.isValidType(value)) {
                return true;
            }
        }

        return false;
    }

    public validate(value: unknown, path: string[] = []): void {
        for (const schema of this.schemas) {
            if (schema.isValidType(value)) {
                schema.validate(value, path);

                return;
            }
        }

        const types = this.getTypes();

        throw new Violation(
            `Expected value of type ${types.slice(0, -1).join(', ')} or ${types[types.length - 1]} `
            + `at path '${formatPath(path)}', actual ${describe(value)}.`,
            path,
            {type: types.join('|')},
        );
    }
}
