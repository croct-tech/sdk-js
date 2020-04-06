import Tracker from '../../src/tracker';
import {SessionAttributesChanged} from '../../src/event';
import SessionPatch from '../../src/facade/sessionPatch';

describe('A session patch', () => {
    let tracker: Tracker;
    let patch: SessionPatch;

    beforeEach(() => {
        tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn(event => Promise.resolve(event));

        patch = new SessionPatch(tracker);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should not track a "sessionAttributesChanged" event if the patch is empty', async () => {
        const promise = patch.save();

        const expectedEvent: SessionAttributesChanged = {
            type: 'sessionAttributesChanged',
            patch: {
                operations: [],
            },
        };

        await expect(promise).resolves.toEqual(expectedEvent);

        expect(tracker.track).not.toHaveBeenCalled();
    });

    test('should track a "sessionAttributesChanged" event and reset itself', async () => {
        const promise = patch
            .add('foo', 'bar')
            .save();

        const nonEmptyEmpty: SessionAttributesChanged = {
            type: 'sessionAttributesChanged',
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

        const emptyEvent: SessionAttributesChanged = {
            type: 'sessionAttributesChanged',
            patch: {
                operations: [],
            },
        };

        await expect(promise).resolves.toEqual(nonEmptyEmpty);
        await expect(patch.save()).resolves.toStrictEqual(emptyEvent);

        expect(tracker.track).toHaveBeenCalledTimes(1);
    });
});
