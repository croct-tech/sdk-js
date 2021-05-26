import {TypeSchema, Violation} from './schema';
import {describe, formatPath} from './violation';

export class FunctionType implements TypeSchema {
    public getTypes(): string[] {
        return ['function'];
    }

    public isValidType(value: unknown): value is boolean {
        return typeof value === 'function';
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            throw new Violation(
                `Expected value of type function at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'function'},
            );
        }
    }
}
