import Tracker from '../../src/tracker';
import TrackerFacade from '../../src/facade/trackerFacade';
import {ExternalEvent, ExternalEventPayload, ExternalEventType} from '../../src';

describe('A tracker facade', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('can enable the tracker', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.enable = jest.fn();

        const trackerFacade = new TrackerFacade(tracker);
        trackerFacade.enable();

        expect(tracker.enable).toHaveBeenCalledTimes(1);
    });

    test('can disable the tracker', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.disable = jest.fn();

        const trackerFacade = new TrackerFacade(tracker);
        trackerFacade.disable();

        expect(tracker.disable).toHaveBeenCalledTimes(1);
    });

    test('can add event listeners to the tracker', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.addListener = jest.fn();

        const listener = jest.fn();
        const trackerFacade = new TrackerFacade(tracker);
        trackerFacade.addListener(listener);

        expect(tracker.addListener).toHaveBeenCalledWith(listener);
        expect(tracker.addListener).toHaveBeenCalledTimes(1);
    });

    test('can remove event listeners from the tracker', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.removeListener = jest.fn();

        const listener = jest.fn();
        const trackerFacade = new TrackerFacade(tracker);
        trackerFacade.removeListener(listener);

        expect(tracker.removeListener).toHaveBeenCalledWith(listener);
        expect(tracker.removeListener).toHaveBeenCalledTimes(1);
    });

    test('should provide a callback that is called when the current pending events are flushed', async () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        const batch = jest.fn().mockResolvedValue(undefined);

        Object.defineProperty(tracker, 'flushed', {
            get: batch,
        });

        const trackerFacade = new TrackerFacade(tracker);

        await expect(trackerFacade.flushed).resolves.toBeUndefined();

        expect(batch).toHaveBeenCalledTimes(1);
    });

    test.each<ExternalEvent[]>([
        [
            {
                type: 'productViewed',
                product: {
                    productId: '12345',
                    name: 'Smartphone 9',
                    displayPrice: 599.00,
                },
            },
        ],
        [
            {
                type: 'orderPlaced',
                order: {
                    orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                    currency: 'brl',
                    total: 776.49,
                    items: [
                        {
                            index: 0,
                            total: 699.00,
                            quantity: 1,
                            product: {
                                productId: '12345',
                                name: 'Smartphone 9',
                                displayPrice: 599.00,
                            },
                        },
                    ],
                },
            },
        ],
        [
            {
                type: 'cartModified',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                },
            },
        ],
        [
            {
                type: 'cartViewed',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                },
            },
        ],
        [
            {
                type: 'checkoutStarted',
                cart: {
                    currency: 'brl',
                    total: 776.49,
                    items: [],
                },
            },
        ],
        [
            {
                type: 'userSignedUp',
                userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: '1960-06-22',
                    gender: 'male',
                    email: 'john@doe.com',
                    alternateEmail: 'other-john@doe.com',
                    phone: '+5511987654321',
                    alternatePhone: '+5511123456789',
                    address: {
                        street: 'Kingston, 20',
                        district: 'Jardim das Americas',
                        city: 'Cuiaba',
                        region: 'MT',
                        country: 'Brasil',
                        postalCode: '00000-000',
                    },
                    avatar: 'http://croct.com/doe',
                    company: 'Croct',
                    companyUrl: 'http://croct.com',
                    jobTitle: 'CEO',
                    custom: {
                        integer: 1,
                        number: 1.2,
                        null: null,
                        true: true,
                        false: false,
                        emptyString: '',
                        longString: 'x'.repeat(100),
                        array: [1, 1.2, null, true, false, '', 'x'.repeat(100)],
                        map: {
                            integer: 1,
                            number: 1.2,
                            null: null,
                            true: true,
                            false: false,
                            emptyString: '',
                            longString: 'x'.repeat(100),
                        },
                    },
                },
            },
        ],
        [
            {
                type: 'testGroupAssigned',
                testId: 'foo',
                groupId: 'bar',
            },
        ],
        [
            {
                type: 'eventOccurred',
                name: 'event-name',
                personalizationId: 'foo',
                audience: 'bar',
                testId: 'baz',
                groupId: 'barbaz',
                details: {
                    foo: 'bar',
                },
            },
        ],
        [
            {
                type: 'goalAchieved',
                goalId: 'foo',
                value: 1,
                currency: 'brl',
            },
        ],
    ])('should track events', (event: ExternalEvent) => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn();

        const trackerFacade = new TrackerFacade(tracker);

        const {type, ...payload} = event;

        trackerFacade.track(type, payload);

        expect(tracker.track).toHaveBeenNthCalledWith(1, event);
    });

    test('should fail if the event type is not a string', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn();

        const trackerFacade = new TrackerFacade(tracker);

        function track(): void {
            trackerFacade.track(null as unknown as 'userSignedUp', {} as ExternalEventPayload<'userSignedUp'>);
        }

        expect(track).toThrow(Error);
        expect(track).toThrow('The event type must of type string.');
    });

    test('should fail if the event type is unknown', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn();

        const trackerFacade = new TrackerFacade(tracker);

        function track(): void {
            trackerFacade.track('invalidType' as ExternalEventType, {} as ExternalEventPayload<'userSignedUp'>);
        }

        expect(track).toThrow(Error);
        expect(track).toThrow('Unknown event type \'invalidType\'.');
    });

    test('should fail if the event payload is not an object', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn();

        const trackerFacade = new TrackerFacade(tracker);

        function track(): void {
            trackerFacade.track('userSignedUp', null as unknown as ExternalEventPayload<'userSignedUp'>);
        }

        expect(track).toThrow(Error);
        expect(track).toThrow('The event payload must of type object.');
    });

    test('should fail if the event payload is invalid', () => {
        const tracker = jest.genMockFromModule<Tracker>('../../src/tracker');
        tracker.track = jest.fn();

        const trackerFacade = new TrackerFacade(tracker);

        function track(): void {
            trackerFacade.track('userSignedUp', {} as ExternalEventPayload<'userSignedUp'>);
        }

        expect(track).toThrow(Error);
        expect(track).toThrow('Invalid event payload');
    });
});
