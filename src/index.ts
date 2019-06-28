import Sdk from './sdk';
import {Token} from './token';
import {validate as validateUserAttributes} from './validation/userAttributes';
import {validate as validateInitializationOptions} from './validation/initializationOptions';
import {format} from './validation';

export default {
    enable(options: any = {}): void {
        const violation = validateInitializationOptions(options);

        if (violation !== null) {
            throw new Error(format(violation));
        }

        const {track = true, ...sdkOptions} = options;

        Sdk.install(sdkOptions);

        if (track) {
            Sdk.tracker.enable();
        }
    },
    disable(): void {
        Sdk.uninstall();
    },
    tracker: {
        enable(): void {
            Sdk.tracker.enable();
        },

        disable(): void {
            Sdk.tracker.disable();
        },
    },
    user: {
        isLogged: (): boolean => {
            return Sdk.tracker.hasToken();
        },

        getToken: (): Token | null => {
            return Sdk.tracker.getToken();
        },

        login(userId: any): void {
            if (typeof userId !== 'string' || userId === '') {
                throw new Error('The user ID must be a non-empty string.');
            }

            Sdk.tracker.identify(userId);
        },

        logout(): void {
            Sdk.tracker.anonymize();
        },

        setAttributes(attributes: any): void {
            const violation = validateUserAttributes(attributes);

            if (violation !== null) {
                throw new Error(format(violation));
            }

            if (Object.keys(attributes).length === 0) {
                // The list is empty, there is nothing to do...
                return;
            }

            attributes = {...attributes};

            if (attributes.firstName === '') {
                delete attributes.firstName;
            }

            if (attributes.custom && Object.keys(attributes.custom).length === 0) {
                delete attributes.custom;
            }

            Sdk.tracker.track({
                type: 'userProfileChanged',
                attributes: attributes
            });
        },
    },
};