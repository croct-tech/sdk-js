import type {Logger} from '../src/logging';
import {EventSubjectProcessor} from '../src/eventSubjectProcessor';
import type {QueuedEventInfo} from '../src/tracker';
import {Token} from '../src/token';

describe('EventSubjectProcessor', () => {
    const logger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should never track events for the first event', () => {
        const processor = new EventSubjectProcessor(logger);

        const event: QueuedEventInfo = {
            timestamp: 0,
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        const result = processor.process(event);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(event);
    });

    it.each<QueuedEventInfo>([
        {
            timestamp: 0,
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'userSignedIn',
                userId: '00000000-0000-0000-0000-000000000000',
            },
        },
        {
            timestamp: 0,
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'userSignedOut',
                userId: '00000000-0000-0000-0000-000000000000',
            },
        },
        {
            timestamp: 0,
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'userSignedUp',
                userId: '00000000-0000-0000-0000-000000000000',
            },
        },
    ])('should ignore "$event.type" events', event => {
        const processor = new EventSubjectProcessor(logger);

        const firstEvent: QueuedEventInfo = {
            timestamp: 0,
            // Specify a user token to ensure the event is ignored even with different user tokens
            userToken: Token.issue('00000000-0000-0000-0000-000000000000', 'user-id'),
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        // First event
        const firstEventResult = processor.process(firstEvent);

        expect(firstEventResult).toHaveLength(1);
        expect(firstEventResult[0]).toBe(firstEvent);

        const secondEventResult = processor.process(event);

        expect(secondEventResult).toHaveLength(1);
        expect(secondEventResult[0]).toBe(event);
    });

    it('should ignore events with the same subject', () => {
        const processor = new EventSubjectProcessor(logger);

        const event: QueuedEventInfo = {
            timestamp: 0,
            userToken: Token.issue('00000000-0000-0000-0000-000000000000', 'user-id'),
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        const firstEventResult = processor.process(event);

        expect(firstEventResult).toHaveLength(1);
        expect(firstEventResult[0]).toBe(event);

        const secondEventResult = processor.process(event);

        expect(secondEventResult).toHaveLength(1);
        expect(secondEventResult[0]).toBe(event);
    });

    it('should track a sign out event when the subject changes to anonymous', () => {
        const processor = new EventSubjectProcessor(logger);

        const firstEvent: QueuedEventInfo = {
            timestamp: 0,
            userToken: Token.issue('00000000-0000-0000-0000-000000000000', 'user-id'),
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        const secondEvent: QueuedEventInfo = {
            timestamp: 0,
            userToken: Token.issue('00000000-0000-0000-0000-000000000000'),
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        const firstEventResult = processor.process(firstEvent);

        expect(firstEventResult).toHaveLength(1);
        expect(firstEventResult[0]).toBe(firstEvent);

        const secondEventResult = processor.process(secondEvent);

        expect(secondEventResult).toHaveLength(2);

        expect(secondEventResult[0]).toEqual({
            timestamp: 0,
            context: secondEvent.context,
            userToken: firstEvent.userToken,
            event: {
                type: 'userSignedOut',
                userId: 'user-id',
            },
        });

        expect(secondEventResult[1]).toBe(secondEvent);
    });

    it('should track a sign in event when the subject changes to a known user', () => {
        const processor = new EventSubjectProcessor(logger);

        const firstEvent: QueuedEventInfo = {
            timestamp: 0,
            userToken: Token.issue('00000000-0000-0000-0000-000000000000'),
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        const secondEvent: QueuedEventInfo = {
            timestamp: 0,
            userToken: Token.issue('00000000-0000-0000-0000-000000000000', 'user-id'),
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        const firstEventResult = processor.process(firstEvent);

        expect(firstEventResult).toHaveLength(1);
        expect(firstEventResult[0]).toBe(firstEvent);

        const secondEventResult = processor.process(secondEvent);

        expect(secondEventResult).toHaveLength(2);

        expect(secondEventResult[0]).toEqual({
            timestamp: 0,
            context: secondEvent.context,
            userToken: secondEvent.userToken,
            event: {
                type: 'userSignedIn',
                userId: 'user-id',
            },
        });

        expect(secondEventResult[1]).toBe(secondEvent);
    });

    it('should track sign in and sing out events when the subject changes from one known user to another', () => {
        const processor = new EventSubjectProcessor(logger);

        const firstEvent: QueuedEventInfo = {
            timestamp: 0,
            userToken: Token.issue('00000000-0000-0000-0000-000000000000', 'user-id-1'),
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        const secondEvent: QueuedEventInfo = {
            timestamp: 0,
            userToken: Token.issue('00000000-0000-0000-0000-000000000000', 'user-id-2'),
            context: {
                tabId: '00000000-0000-0000-0000-000000000000',
                url: 'https://example.com',
                metadata: {},
            },
            event: {
                type: 'nothingChanged',
                sinceTime: 0,
            },
        };

        const firstEventResult = processor.process(firstEvent);

        expect(firstEventResult).toHaveLength(1);
        expect(firstEventResult[0]).toBe(firstEvent);

        const secondEventResult = processor.process(secondEvent);

        expect(secondEventResult).toHaveLength(3);

        expect(secondEventResult[0]).toEqual({
            timestamp: 0,
            context: secondEvent.context,
            userToken: firstEvent.userToken,
            event: {
                type: 'userSignedOut',
                userId: 'user-id-1',
            },
        });

        expect(secondEventResult[1]).toEqual({
            timestamp: 0,
            context: secondEvent.context,
            userToken: secondEvent.userToken,
            event: {
                type: 'userSignedIn',
                userId: 'user-id-2',
            },
        });

        expect(secondEventResult[2]).toBe(secondEvent);
    });
});
