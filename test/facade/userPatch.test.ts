import type {Tracker} from '../../src/tracker';
import type {UserProfileChanged} from '../../src/trackingEvents';
import {UserPatch} from '../../src/facade';

describe('A user patch', () => {
    let tracker: Tracker;
    let patch: UserPatch;

    beforeEach(() => {
        const mock = jest.createMockFromModule<{Tracker: new() => Tracker}>('../../src/tracker');

        tracker = new mock.Tracker();

        jest.spyOn(tracker, 'track').mockImplementation(event => Promise.resolve(event));

        patch = new UserPatch(tracker);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should not track a "userProfileChanged" event if the patch is empty', async () => {
        const promise = patch.save();

        const expectedEvent: UserProfileChanged = {
            type: 'userProfileChanged',
            patch: {
                operations: [],
            },
        };

        await expect(promise).resolves.toEqual(expectedEvent);
        expect(tracker.track).not.toHaveBeenCalled();
    });

    it('should track a "userProfileChanged" event and reset itself', async () => {
        const promise = patch.add('foo', 'bar')
            .save();

        const nonEmptyEvent: UserProfileChanged = {
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

        const emptyEvent: UserProfileChanged = {
            type: 'userProfileChanged',
            patch: {
                operations: [],
            },
        };

        await expect(promise).resolves.toEqual(nonEmptyEvent);
        await expect(patch.save()).resolves.toStrictEqual(emptyEvent);

        expect(tracker.track).toHaveBeenCalledTimes(1);
    });
});
