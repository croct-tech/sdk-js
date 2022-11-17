import {Tracker} from '../../src/tracker';
import {SessionFacade} from '../../src/facade';
import {SessionAttributesChanged} from '../../src/trackingEvents';

describe('A session facade', () => {
    let tracker: Tracker;
    let sessionFacade: SessionFacade;

    beforeEach(() => {
        const mock = jest.createMockFromModule<{Tracker: new() => Tracker}>('../../src/tracker');

        tracker = new mock.Tracker();

        jest.spyOn(tracker, 'track').mockImplementation(event => Promise.resolve(event));

        sessionFacade = new SessionFacade(tracker);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should always start a new patch', () => {
        expect(sessionFacade.edit()).not.toBe(sessionFacade.edit());
    });

    it('should initialize the patch with the tracker', async () => {
        const promise = sessionFacade.edit()
            .add('foo', 'bar')
            .save();

        const expectedEvent: SessionAttributesChanged = {
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

        await expect(promise).resolves.toEqual(expectedEvent);
        expect(tracker.track).toHaveBeenCalledTimes(1);
    });
});
