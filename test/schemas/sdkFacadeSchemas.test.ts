import {configurationSchema} from '../../src/schema/sdkFacadeSchemas';

describe('The SDK facade configuration schema', () => {
    test.each([
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            tokenScope: 'global',
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            trackerEndpointUrl: 'https://api.croct.io/tracker',
            evaluationEndpointUrl: 'https://api.croct.io/evaluation',
            bootstrapEndpointUrl: 'https://api.croct.io/bootstrap',
            tokenScope: 'isolated',
            userId: 'c4r0l',
            token: 'a.b.c',
            debug: true,
            track: true,
            logger: {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
        }],
    ])('should allow %s', (value: object) => {
        function validate(): void {
            configurationSchema.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [
            {},
            "Missing property '/appId'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', bootstrapEndpointUrl: 'x'},
            "Invalid url format at path '/bootstrapEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', evaluationEndpointUrl: 'x'},
            "Invalid url format at path '/evaluationEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', trackerEndpointUrl: 'x'},
            "Invalid url format at path '/trackerEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', tokenScope: 'x'},
            "Unexpected value at path '/tokenScope'",
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
            "Expected value of type string at path '/token', actual integer.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', debug: 'foo'},
            "Expected value of type boolean at path '/debug', actual string.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', track: 'foo'},
            "Expected value of type boolean at path '/track', actual string.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', logger: null},
            "Expected value of type object at path '/logger', actual null.",
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            configurationSchema.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
