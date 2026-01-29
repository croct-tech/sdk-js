import type {Schema} from './schema';

export class MixedSchema implements Schema {
    public validate(): void {
        // always valid
    }
}
