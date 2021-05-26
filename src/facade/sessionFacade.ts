import {Tracker} from '../tracker';
import {SessionPatch} from './sessionPatch';

export class SessionFacade {
    private readonly tracker: Tracker;

    public constructor(tracker: Tracker) {
        this.tracker = tracker;
    }

    public edit(): SessionPatch {
        return new SessionPatch(this.tracker);
    }
}
