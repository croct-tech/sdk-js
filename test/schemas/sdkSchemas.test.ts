import {sdkConfigurationSchema, eventMetadataSchema} from '../../src/schema';

describe('The event metadata schema', () => {
    test.each([
        [{}],
        [{
            foo: 'bar',
            _keyWith20Characters: 'x'.repeat(300),
            thirdKey: 'someValue',
            fourthKey: 'someValue',
            fifthKey: 'someValue',
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            eventMetadataSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    test.each([
        [
            {
                '@foo': 'foo',
            },
            "Invalid identifier format at path '/@foo'.",
        ],
        [
            {
                _keyWith21Characters_: 'foo',
            },
            "Expected at most 20 characters at path '/_keyWith21Characters_', actual 21.",
        ],
        [
            {
                longValue: 'x'.repeat(301),
            },
            "Expected at most 300 characters at path '/longValue', actual 301.",
        ],
        [
            {
                a: '1',
                b: '2',
                c: '3',
                d: '4',
                e: '5',
                f: '6',
            },
            "Expected at most 5 entries at path '/', actual 6.",
        ],
        [
            {
                foo: 1,
            },
            "Expected value of type string at path '/foo', actual integer.",
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            eventMetadataSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The SDK configuration schema', () => {
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
            clientId: '9f62d6343c8742028df3e9e3ec596526',
            tokenScope: 'isolated',
            trackerEndpointUrl: 'https://api.croct.io/tracker',
            evaluationEndpointUrl: 'https://api.croct.io/evaluation',
            contentEndpointUrl: 'https://api.croct.io/content',
            cidAssignerEndpointUrl: 'https://api.croct.io/cid',
            beaconQueueSize: 1,
            debug: true,
            test: true,
            logger: {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
            eventMetadata: {},
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            sdkConfigurationSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    test.each([
        [
            {},
            "Missing property '/appId'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', clientId: '7e9d59a9'},
            "Invalid format at path '/clientId'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', tokenScope: 'x'},
            "Unexpected value at path '/tokenScope', expecting 'global', 'contextual' or 'isolated', found 'x'.",
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
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', trackerEndpointUrl: 'foo'},
            "Invalid url format at path '/trackerEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', evaluationEndpointUrl: 'foo'},
            "Invalid url format at path '/evaluationEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', contentEndpointUrl: 'foo'},
            "Invalid url format at path '/contentEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', cidAssignerEndpointUrl: 'foo'},
            "Invalid url format at path '/cidAssignerEndpointUrl'.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', beaconQueueSize: -1},
            "Expected a value greater than or equal to 0 at path '/beaconQueueSize', actual -1.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', beaconQueueSize: 1.2},
            "Expected value of type integer at path '/beaconQueueSize', actual number.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', eventMetadata: {foo: 1}},
            "Expected value of type string at path '/eventMetadata/foo', actual integer.",
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', logger: null},
            "Expected value of type object at path '/logger', actual null.",
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            sdkConfigurationSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
