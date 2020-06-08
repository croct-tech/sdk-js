import Tracker from '../../src/tracker';
import UserFacade from '../../src/facade/userFacade';
import {UserProfileChanged} from '../../src/trackingEvents';
import Context from '../../src/context';

describe('A user facade', () => {
    const {default: ContextMock} = jest.genMockFromModule<{default: jest.Mock<Context>}>('../../src/context');
    const {default: TrackerMock} = jest.genMockFromModule<{default: jest.Mock<Tracker>}>('../../src/tracker');

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should determine whether the user is anonymous or identified', () => {
        const tracker = new TrackerMock();
        const context = new ContextMock();
        const userFacade = new UserFacade(context, tracker);

        // mock tracker.isUserAnonymous() call
        context.isAnonymous = jest.fn(() => true);

        expect(userFacade.isAnonymous()).toBeTruthy();
        expect(userFacade.isIdentified()).toBeFalsy();

        // mock tracker.isUserAnonymous() call
        context.isAnonymous = jest.fn(() => false);

        expect(userFacade.isAnonymous()).toBeFalsy();
        expect(userFacade.isIdentified()).toBeTruthy();
    });

    test('should always start a new patch', async () => {
        const userFacade = new UserFacade(new ContextMock(), new TrackerMock());

        expect(userFacade.edit()).not.toBe(userFacade.edit());
    });

    test('should initialize the patch with the tracker', async () => {
        const tracker = new TrackerMock();
        tracker.track = jest.fn().mockImplementation(event => Promise.resolve(event));

        const userFacade = new UserFacade(new ContextMock(), tracker);

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
