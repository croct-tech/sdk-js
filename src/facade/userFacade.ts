import Tracker from '../tracker';
import UserPatch from './userPatch';

export default class UserFacade {
    private readonly tracker: Tracker;

    public constructor(tracker: Tracker) {
        this.tracker = tracker;
    }

    public isIdentified(): boolean {
        return !this.isAnonymous();
    }

    public isAnonymous(): boolean {
        return this.tracker.isUserAnonymous();
    }

    public edit(): UserPatch {
        return new UserPatch(this.tracker);
    }
}
