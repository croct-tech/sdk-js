import {TypeSchema, Violation} from './schema';
import {describe, formatPath} from './violation';

export class BooleanType implements TypeSchema {
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
