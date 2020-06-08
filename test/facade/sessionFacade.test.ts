import Tracker from '../../src/tracker';
import SessionFacade from '../../src/facade/sessionFacade';
import {SessionAttributesChanged} from '../../src/trackingEvents';

describe('A session facade', () => {
    let tracker: Tracker;
    let sessionFacade: SessionFacade;

    beforeEach(() => {
        tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn(event => Promise.resolve(event));

        sessionFacade = new SessionFacade(tracker);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should always start a new patch', async () => {
        expect(sessionFacade.edit()).not.toBe(sessionFacade.edit());
    });

    test('should initialize the patch with the tracker', async () => {
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
