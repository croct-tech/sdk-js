import Tracker from '../../src/tracker';
import UserFacade from '../../src/facade/userFacade';
import {UserProfileChanged} from '../../src/event';

describe('A user facade', () => {
    let tracker: Tracker;
    let userFacade: UserFacade;

    beforeEach(() => {
        tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn(event => Promise.resolve(event));

        userFacade = new UserFacade(tracker);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should determine whether the user is anonymous or identified', () => {
        // mock tracker.isUserAnonymous() call
        tracker.isUserAnonymous = jest.fn(() => true);

        expect(userFacade.isAnonymous()).toBeTruthy();
        expect(userFacade.isIdentified()).toBeFalsy();

        // mock tracker.isUserAnonymous() call
        tracker.isUserAnonymous = jest.fn(() => false);

        expect(userFacade.isAnonymous()).toBeFalsy();
        expect(userFacade.isIdentified()).toBeTruthy();
    });

    test('should not track "userProfileChanged" events with an empty patch', async () => {
        const promise = userFacade.save();

        const expectedEvent: UserProfileChanged = {
            type: 'userProfileChanged',
            patch: {
                operations: [],
            },
        };

        await expect(promise).resolves.toEqual(expectedEvent);
        expect(tracker.track).not.toHaveBeenCalled();
    });

    test('should track "userProfileChanged" events with a non-empty patch', async () => {
        const promise = userFacade
            .add('foo', 'bar')
            .save();

        const expectedEvent: UserProfileChanged = {
            type: 'userProfileChanged',
            patch: {
                operations: [
                    {
                        type: 'add',
                        path: 'foo',
                        value: 'bar',
                    },
                ],
            },
        };

        await expect(promise).resolves.toEqual(expectedEvent);
        expect(tracker.track).toHaveBeenCalledTimes(1);
    });
});
