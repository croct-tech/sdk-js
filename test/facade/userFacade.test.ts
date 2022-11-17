import {Tracker} from '../../src/tracker';
import {UserFacade} from '../../src/facade';
import {UserProfileChanged} from '../../src/trackingEvents';
import {Context} from '../../src/context';

describe('A user facade', () => {
    function createContextMock(): Context {
        return jest.createMockFromModule<{Context: Context}>('../../src/context').Context;
    }

    function createTrackerMock(): Tracker {
        return jest.createMockFromModule<{Tracker: Tracker}>('../../src/tracker').Tracker;
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should determine whether the user is anonymous or identified', () => {
        const tracker = createTrackerMock();
        const context = createContextMock();
        const userFacade = new UserFacade(context, tracker);

        // mock tracker.isUserAnonymous() call
        jest.spyOn(context, 'isAnonymous').mockImplementation(() => true);

        expect(userFacade.isAnonymous()).toBeTruthy();
        expect(userFacade.isIdentified()).toBeFalsy();

        // mock tracker.isUserAnonymous() call
        jest.spyOn(context, 'isAnonymous').mockImplementation(() => false);

        expect(userFacade.isAnonymous()).toBeFalsy();
        expect(userFacade.isIdentified()).toBeTruthy();
    });

    it('should always start a new patch', () => {
        const userFacade = new UserFacade(createContextMock(), createTrackerMock());

        expect(userFacade.edit()).not.toBe(userFacade.edit());
    });

    it('should initialize the patch with the tracker', async () => {
        const tracker = createTrackerMock();

        jest.spyOn(tracker, 'track')
            .mockImplementation()
            .mockImplementation(event => Promise.resolve(event));

        const userFacade = new UserFacade(createContextMock(), tracker);

        const promise = userFacade.edit()
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
