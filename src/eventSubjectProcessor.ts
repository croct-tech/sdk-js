import {QueuedEventInfo, TrackingEventProcessor} from './tracker';
import {Token} from './token';
import {Logger} from './logging';
import {TrackingEvent} from './trackingEvents';

export class EventSubjectProcessor implements TrackingEventProcessor {
    private currentToken?: Token|null;

    private logger: Logger;

    public constructor(logger: Logger) {
        this.logger = logger;
    }

    public process(event: QueuedEventInfo): QueuedEventInfo[] {
        const {currentToken} = this;

        this.currentToken = event.userToken ?? null;

        if (currentToken === undefined) {
            // This is the first event, no subject to compare.
            // If the user is already identified at this point,
            // assume that the event was previously tracked.
            return [event];
        }

        if (EventSubjectProcessor.isIdentificationEvent(event.event)) {
            return [event];
        }

        const currentSubject = currentToken?.getSubject() ?? null;
        const newSubject = event.userToken?.getSubject() ?? null;

        if (newSubject === currentSubject) {
            // No change in subject
            return [event];
        }

        const events: QueuedEventInfo[] = [];

        if (currentToken !== null && currentSubject !== null) {
            this.logger.info('External user sign out automatically tracked');

            events.push({
                timestamp: event.timestamp,
                context: event.context,
                userToken: currentToken,
                event: {
                    type: 'userSignedOut',
                    userId: currentSubject,
                },
            });
        }

        if (newSubject !== null) {
            this.logger.info('External user sign in automatically tracked');

            events.push({
                timestamp: event.timestamp,
                context: event.context,
                userToken: event.userToken,
                event: {
                    type: 'userSignedIn',
                    userId: newSubject,
                },
            });
        }

        events.push(event);

        return events;
    }

    private static isIdentificationEvent(event: TrackingEvent): boolean {
        switch (event.type) {
            case 'userSignedIn':
            case 'userSignedUp':
            case 'userSignedOut':
                return true;

            default:
                return false;
        }
    }
}
