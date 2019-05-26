import {describe, formatPath, TypeSchema, Violation} from './index';

export default class BooleanType implements TypeSchema {
    public getTypes(): string[] {
        return ['boolean'];
    }

    public isValidType(value: unknown): value is boolean {
        return typeof value === 'boolean';
    }

    public validate(value: unknown, path: string[] = []): void {
        if (!this.isValidType(value)) {
            throw new Violation(
                `Expected value of type boolean at path '${formatPath(path)}', actual ${describe(value)}.`,
                path,
                {type: 'boolean'},
            );
        }
    }
}
