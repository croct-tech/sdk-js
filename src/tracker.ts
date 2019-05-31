import {record, mirror} from 'rrweb';
import {
    eventWithTime as Event,
    incrementalData as IncrementalData, IncrementalSource,
    listenerHandler as StopRecorderCallback, metaEvent as MetaEvent, MouseInteractions
} from 'rrweb/typings/types';
import {Logger} from "./logging";
import {Token} from "./token";
import {Context} from "./context";
import {BeaconPayload} from "./beacon";

class Tracker {
    private logger: Logger;
    private readonly context: Context;
    private enabled: boolean = false;
    private stopRecording?: StopRecorderCallback;
    private pendingEvents: Event[] = [];

    constructor(context: Context, logger: Logger) {
        this.context = context;
        this.logger = logger;
    }

    enable() {
        if (this.enabled) {
            return;
        }

        this.stopRecording = record({emit: this.emit});

        this.enabled = true;

        this.logger.log('Tracker enabled');
    }

    disable() {
        if (!this.enabled) {
            return;
        }

        if (this.stopRecording) {
            this.stopRecording();
            delete  this.stopRecording;
        }

        this.enabled = false;

        this.logger.log('Tracker disabled');
    }

    identify(userId: string) {
        if (userId === '') {
            throw new Error('The user ID cannot be empty');
        }

        this.logger.log(`User identified: ${userId}`);

        this.context.setToken(new Token(userId, Date.now()));
    }

    anonymize() {
        this.logger.log('User anonymized');

        this.context.setToken(null);
    }

    hasToken() : boolean {
        return this.getToken() !== null;
    }

    getToken() : Token | null {
        return this.context.getToken();
    }

    private emit(event: Event) : void {
        console.log(event);
    }

    private createBeacon(event: Event) : object | null {
        const payload = this.createPayload(event);

        if (payload === null) {
            return null;
        }

        return {
            userToken: null,
            timestamp: event.timestamp,
            payload: {
                ...this.createPayload(event)
            }
        };
    }

    private createPayload(event: Event) : BeaconPayload | null {
        switch (event.type) {
            //case EventType.DomContentLoaded:
            case 0:
                break;
            //case EventType.Load:
            case 1:
                break;
            //case EventType.FullSnapshot:
            case 2:
                const meta = this.pendingEvents.pop() as MetaEvent;

                return {

                }

                break;
            //case EventType.IncrementalSnapshot:
            case 3:
                break;
            //case EventType.Meta:
            case 4:
                this.pendingEvents.push(event);
                break;
        }

        return null;
    }

    private createIncrementalPayload(data: IncrementalData) : BeaconPayload {
        switch (data.source) {
            //case IncrementalSource.Mutation:
            case 0:
                break;
            //case IncrementalSource.MouseMove:
            case 1:
                break;
            //case IncrementalSource.MouseInteraction:
            case 2:
                break;
            //case IncrementalSource.Scroll:
            case 3:
                break;
            //case IncrementalSource.ViewportResize:
            case 4:
                break;
            //case IncrementalSource.Input:
            case 5:
                break;
        }
    }
}

export default Tracker;