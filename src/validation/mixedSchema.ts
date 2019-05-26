import {Schema} from './index';

export default class MixedSchema implements Schema {
    public validate(): void {
        // always valid
    }
}
