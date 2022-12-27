import {sdkFacadeConfigurationSchema} from '../../src/schema';

describe('The SDK facade configuration schema', () => {
    it.each([
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
            baseEndpointUrl: 'https://api.croct.io/',
            cidAssignerEndpointUrl: 'https://api.croct.io/cid',
            tokenScope: 'isolated',
            userId: 'c4r0l',
            token: 'a.b.c',
            debug: true,
            test: true,
            track: true,
            logger: {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
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
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', clientId: '7e9d59a9'},
            "Invalid format at path '/clientId'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', cidAssignerEndpointUrl: 'x'},
            "Invalid url format at path '/cidAssignerEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', baseEndpointUrl: 'x'},
            "Invalid url format at path '/baseEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', tokenScope: 'x'},
            "Unexpected value at path '/tokenScope', expecting 'global', 'contextual' or 'isolated', found 'x'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', userId: ''},
            "Expected at least 1 character at path '/userId', actual 0.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', userId: 1},
            "Expected value of type string at path '/userId', actual integer.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', token: 'foo'},
            "Invalid format at path '/token'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', token: 1},
            "Expected value of type string or null at path '/token', actual integer.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', debug: 'foo'},
            "Expected value of type boolean at path '/debug', actual string.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', test: 'foo'},
            "Expected value of type boolean at path '/test', actual string.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', track: 'foo'},
            "Expected value of type boolean at path '/track', actual string.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', logger: null},
            "Expected value of type object at path '/logger', actual null.",
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            sdkFacadeConfigurationSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
