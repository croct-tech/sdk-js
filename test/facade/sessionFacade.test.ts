import Tracker from '../../src/tracker';
import SessionFacade from '../../src/facade/sessionFacade';
import {SessionAttributesChanged} from '../../src/event';

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

    test('should not track "sessionAttributesChanged" events with an empty patch', async () => {
        const promise = sessionFacade.save();

        const expectedEvent: SessionAttributesChanged = {
            type: 'sessionAttributesChanged',
            patch: {
                operations: [],
            },
        };

        await expect(promise).resolves.toEqual(expectedEvent);

        expect(tracker.track).not.toHaveBeenCalled();
    });

    test('should track "sessionAttributesChanged" events with a non-empty patch', async () => {
        const promise = sessionFacade
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
