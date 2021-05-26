import {ActiveRecord} from '../activeRecord';
import {Tracker} from '../tracker';
import {SessionAttributesChanged} from '../trackingEvents';

export class SessionPatch extends ActiveRecord<SessionAttributesChanged> {
    private readonly tracker: Tracker;

    public constructor(tracker: Tracker) {
        super();

        this.tracker = tracker;
    }

    public save(): Promise<SessionAttributesChanged> {
        if (!this.isDirty()) {
            // Empty patch
            return Promise.resolve({
                type: 'sessionAttributesChanged',
                patch: {operations: []},
            });
        }

        const promise = this.tracker.track({
            type: 'sessionAttributesChanged',
            patch: this.buildPatch(),
        });

        this.reset();

        return promise;
    }
}
