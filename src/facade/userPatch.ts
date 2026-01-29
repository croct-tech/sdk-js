import {ActiveRecord} from '../activeRecord';
import type {Tracker} from '../tracker';
import type {UserProfileChanged} from '../trackingEvents';

export class UserPatch extends ActiveRecord<UserProfileChanged> {
    private readonly tracker: Tracker;

    public constructor(tracker: Tracker) {
        super();

        this.tracker = tracker;
    }

    public save(): Promise<UserProfileChanged> {
        if (!this.isDirty()) {
            // Empty patch
            return Promise.resolve({
                type: 'userProfileChanged',
                patch: {operations: []},
            });
        }

        const promise = this.tracker.track({
            type: 'userProfileChanged',
            patch: this.buildPatch(),
        });

        this.reset();

        return promise;
    }
}
