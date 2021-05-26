import {TypeSchema, Violation} from './schema';
import {describe, formatPath} from './violation';

export class NullType implements TypeSchema {
    public getTypes(): string[] {
        return ['null'];
    }

    public isValidType(value: unknown): value is null {
        return value === null;
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            throw new Violation(
                `Expected value of type null at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'null'},
            );
        }
    }
}
