import Tracker from '../tracker';
import UserPatch from './userPatch';
import Context from '../context';

export default class UserFacade {
    private readonly context: Context;

    private readonly tracker: Tracker;

    public constructor(context: Context, tracker: Tracker) {
        this.context = context;
        this.tracker = tracker;
    }

    public isIdentified(): boolean {
        return !this.isAnonymous();
    }

    public isAnonymous(): boolean {
        return this.context.isAnonymous();
    }

    public edit(): UserPatch {
        return new UserPatch(this.tracker);
    }
}
