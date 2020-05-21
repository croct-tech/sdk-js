import {describe, formatPath, TypeSchema, Violation} from './index';

export default class FunctionType implements TypeSchema {
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
