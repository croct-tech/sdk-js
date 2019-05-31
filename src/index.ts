import Sdk from "./sdk";
import {Token, TokenScope} from "./token";

export default {
    install(config: any) : void {
        if (typeof config !== 'object') {
            throw new Error('The configuration must a key-value map.')
        }

        let {
            apiKey,
            storageNamespace,
            tokenScope,
            debug,
        } = config;

        if (typeof apiKey !== 'string' || config.apiKey === '') {
            throw new Error('The API key must be a non-empty string.');
        }

        if (storageNamespace !== undefined && typeof storageNamespace !== 'string') {
            throw new Error('The option "storageNamespace" must be a non-empty string.');
        }

        if (tokenScope !== undefined && !Object.values(TokenScope).includes(tokenScope)) {
            throw new Error('The option "tokenScope" is invalid.');
        }

        if (tokenScope !== undefined && typeof debug !== 'boolean') {
            throw new Error('The option "debug" must be true or false.');
        }

        Sdk.install(config);
    },
    uninstall() : void {
        Sdk.uninstall();
    },

    tracker: {
        enable: () => {
            Sdk.tracker.enable();
        },

        disable: () => {
            Sdk.tracker.disable();
        }
    },
    user: {
        isLogged: () : boolean => {
            return Sdk.tracker.hasToken();
        },

        getToken: () : Token | null => {
            return Sdk.tracker.getToken();
        },

        login(userId: any): void {
            if (typeof userId !== 'string' || userId === '') {
                throw new Error('The user ID must be a non-empty string.');
            }

            Sdk.tracker.identify(userId);
        },

        logout() : void {
            Sdk.tracker.anonymize();
        }
    }
};