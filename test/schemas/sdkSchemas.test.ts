import {configurationSchema, eventMetadataSchema} from '../../src/schema/sdkSchemas';

describe('The event metadata schema', () => {
    test.each([
        [{}],
        [{
            foo: 'bar',
            _keyWith20Characters: 'stringValueWith100Characters______________'
                + '__________________________________________________________',
            thirdKey: 'someValue',
            fourthKey: 'someValue',
            fifthKey: 'someValue',
        }],
    ])('should allow %s', (value: object) => {
        function validate(): void {
            eventMetadataSchema.validate(value);
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [
            {
                '@foo': 'foo',
            },
            'Invalid identifier format at path \'/@foo\'.',
        ],
        [
            {
                _keyWith21Characters_: 'foo',
            },
            'Expected at most 20 characters at path \'/_keyWith21Characters_\', actual 21.',
        ],
        [
            {
                longValue: 'stringValueWith101Characters____________________'
                    + '_____________________________________________________',
            },
            'Expected at most 100 characters at path \'/longValue\', actual 101.',
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
            'Expected at most 5 entries at path \'/\', actual 6.',
        ],
        [
            {
                foo: 1,
            },
            'Expected value of type string at path \'/foo\', actual integer.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            eventMetadataSchema.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
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
            tokenScope: 'isolated',
            trackerEndpointUrl: 'http://www.foo.com',
            evaluationEndpointUrl: 'http://www.bar.com',
            bootstrapEndpointUrl: 'http://www.baz.com',
            beaconQueueSize: 1,
            debug: true,
            logger: true,
            eventMetadata: {},
        }],
    ])('should allow %s', (value: object) => {
        function validate(): void {
            configurationSchema.validate(value);
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [
            {},
            'Missing property \'/appId\'.',
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', tokenScope: 'x'},
            'Unexpected value at path \'/tokenScope\'',
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', debug: 'foo'},
            'Expected value of type boolean at path \'/debug\', actual string.',
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', trackerEndpointUrl: 'foo'},
            'Invalid url format at path \'/trackerEndpointUrl\'.',
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', evaluationEndpointUrl: 'foo'},
            'Invalid url format at path \'/evaluationEndpointUrl\'.',
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', bootstrapEndpointUrl: 'foo'},
            'Invalid url format at path \'/bootstrapEndpointUrl\'.',
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', beaconQueueSize: -1},
            'Expected a value greater than or equal to 0 at path \'/beaconQueueSize\', actual -1.',
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', beaconQueueSize: 1.2},
            'Expected value of type integer at path \'/beaconQueueSize\', actual number.',
        ],
        [
            {appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a', eventMetadata: {foo: 1}},
            'Expected value of type string at path \'/eventMetadata/foo\', actual integer.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            configurationSchema.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
