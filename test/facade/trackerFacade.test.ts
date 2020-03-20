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
                firstName: 'John',
                lastName: 'Doe',
                birthDate: '1960-06-22',
                gender: 'male',
                email: 'john@doe.com',
                phone: '+5511987654321',
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