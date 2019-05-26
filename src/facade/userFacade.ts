import ActiveRecord from '../activeRecord';
import Tracker from '../tracker';
import {UserProfileChanged} from '../event';

export default class UserFacade extends ActiveRecord<UserProfileChanged> {
    private readonly tracker: Tracker;

    public constructor(tracker: Tracker) {
        super();

        this.tracker = tracker;
    }

    public isIdentified(): boolean {
        return !this.isAnonymous();
    }

    public isAnonymous(): boolean {
        return this.tracker.isUserAnonymous();
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
