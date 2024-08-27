import {sdkFacadeConfigurationSchema} from '../../src/schema';
import {Configuration} from '../../src/facade/sdkFacade';

describe('The SDK facade configuration schema', () => {
    it.each<Configuration[]>([
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            clientId: '9f62d6343c8742028df3e9e3ec596526',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            tokenScope: 'global',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            token: null,
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            userId: null,
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            defaultPreferredLocale: 'pt',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            defaultPreferredLocale: 'pt_br',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            defaultPreferredLocale: 'pt_BR',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            defaultPreferredLocale: 'pt-br',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            defaultPreferredLocale: 'pt-BR',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            defaultPreferredLocale: 'abc_cde',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            baseEndpointUrl: 'https://api.croct.io/',
            cidAssignerEndpointUrl: 'https://api.croct.io/cid',
            tokenScope: 'isolated',
            userId: 'c4r0l',
            token: 'a.b.c',
            disableCidMirroring: true,
            debug: true,
            test: true,
            track: true,
            logger: {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
            cookie: {
                clientId: {
                    name: 'cid',
                    domain: 'croct.com',
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                },
                userToken: {
                    name: 'utk',
                    domain: 'croct.com',
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                },
                previewToken: {
                    name: 'ptk',
                    domain: 'croct.com',
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                },
            },
            defaultFetchTimeout: 1000,
        }],
    ])('should allow %s', value => {
        function validate(): void {
            sdkFacadeConfigurationSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {},
            "Missing property '/appId'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                clientId: '7e9d59a9',
            },
            "Invalid format at path '/clientId'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                cidAssignerEndpointUrl: 'x',
            },
            "Invalid url format at path '/cidAssignerEndpointUrl'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                baseEndpointUrl: 'x',
            },
            "Invalid url format at path '/baseEndpointUrl'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'x',
            },
            "Unexpected value at path '/tokenScope', expecting 'global', 'contextual' or 'isolated', found 'x'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                userId: '',
            },
            "Expected at least 1 character at path '/userId', actual 0.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                userId: 1,
            },
            "Expected value of type string or null at path '/userId', actual integer.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                token: 'foo',
            },
            "Invalid format at path '/token'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                token: 1,
            },
            "Expected value of type string or null at path '/token', actual integer.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                debug: 'foo',
            },
            "Expected value of type boolean at path '/debug', actual string.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                test: 'foo',
            },
            "Expected value of type boolean at path '/test', actual string.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                track: 'foo',
            },
            "Expected value of type boolean at path '/track', actual string.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                disableCidMirroring: 'foo',
            },
            "Expected value of type boolean at path '/disableCidMirroring', actual string.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                logger: null,
            },
            "Expected value of type object at path '/logger', actual null.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                defaultPreferredLocale: '',
            },
            "Invalid format at path '/defaultPreferredLocale'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                defaultPreferredLocale: 'fooo',
            },
            'Invalid format at path \'/defaultPreferredLocale\'.',
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                defaultPreferredLocale: 'foo-baar',
            },
            'Invalid format at path \'/defaultPreferredLocale\'.',
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                defaultPreferredLocale: 'foo_baar',
            },
            'Invalid format at path \'/defaultPreferredLocale\'.',
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                cookie: null,
            },
            "Expected value of type object at path '/cookie', actual null.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                cookie: {
                    clientId: {
                        name: null,
                    },
                },
            },
            "Expected value of type string at path '/cookie/clientId/name', actual null.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                cookie: {
                    userToken: {
                        name: null,
                    },
                },
            },
            "Expected value of type string at path '/cookie/userToken/name', actual null.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                cookie: {
                    previewToken: {
                        name: null,
                    },
                },
            },
            "Expected value of type string at path '/cookie/previewToken/name', actual null.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                defaultFetchTimeout: 0,
            },
            'Expected a value greater than or equal to 1 at path \'/defaultFetchTimeout\', actual 0.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            sdkFacadeConfigurationSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
