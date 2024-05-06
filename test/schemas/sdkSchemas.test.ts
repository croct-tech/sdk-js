import {sdkConfigurationSchema, eventMetadataSchema, cookieOptionsSchema} from '../../src/schema';
import {Configuration} from '../../src';

describe('The event metadata schema', () => {
    it.each([
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

    it.each([
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

describe('The cookie options schema', () => {
    it.each([
        [{
            name: 'foo',
        }],
        [{
            name: 'foo',
            domain: 'example.com',
        }],
        [{
            name: 'foo',
            domain: 'example.com',
            path: '/',
        }],
        [{
            name: 'foo',
            domain: 'example.com',
            path: '/',
            secure: true,
        }],
        [{
            name: 'foo',
            domain: 'example.com',
            path: '/',
            secure: true,
            sameSite: 'strict',
        }],
        [{
            name: 'foo',
            domain: 'example.com',
            path: '/',
            secure: true,
            sameSite: 'strict',
            maxAge: 0,
        }],
        [{
            name: 'foo',
            domain: 'example.com',
            path: '/',
            secure: true,
            sameSite: 'strict',
            maxAge: 0,
        }],
    ])('should allow %s', value => {
        function validate(): void {
            cookieOptionsSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {
                domain: 'example.com',
            },
            "Missing property '/name'.",
        ],
        [
            {
                name: '',
            },
            "Expected at least 1 character at path '/name', actual 0.",
        ],
        [
            {
                name: 1,
            },
            "Expected value of type string at path '/name', actual integer.",
        ],
        [
            {
                name: 'foo',
                domain: '',
            },
            "Expected at least 1 character at path '/domain', actual 0.",
        ],
        [
            {
                name: 'foo',
                domain: 1,
            },
            "Expected value of type string at path '/domain', actual integer.",
        ],
        [
            {
                name: 'foo',
                path: '',
            },
            "Expected at least 1 character at path '/path', actual 0.",
        ],
        [
            {
                name: 'foo',
                path: 1,
            },
            "Expected value of type string at path '/path', actual integer.",
        ],
        [
            {
                name: 'foo',
                secure: 'foo',
            },
            "Expected value of type boolean at path '/secure', actual string.",
        ],
        [
            {
                name: 'foo',
                sameSite: 'foo',
            },
            "Unexpected value at path '/sameSite', expecting 'strict', 'lax' or 'none', found 'foo'.",
        ],
        [
            {
                name: 'foo',
                maxAge: -1,
            },
            "Expected a value greater than or equal to 0 at path '/maxAge', actual -1.",
        ],
        [
            {
                name: 'foo',
                maxAge: 1.2,
            },
            "Expected value of type integer at path '/maxAge', actual number.",
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            cookieOptionsSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The SDK configuration schema', () => {
    it.each<Configuration[]>([
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            tokenScope: 'global',
            disableCidMirroring: true,
            debug: true,
            test: true,
        }],
        [{
            appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
            clientId: '9f62d6343c8742028df3e9e3ec596526',
            tokenScope: 'isolated',
            baseEndpointUrl: 'https://api.croct.io',
            cidAssignerEndpointUrl: 'https://api.croct.io/cid',
            beaconQueueSize: 1,
            disableCidMirroring: true,
            debug: true,
            test: true,
            logger: {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
            eventMetadata: {},
            cookie: {
                clientId: {
                    name: 'cid',
                    domain: 'example.com',
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 0,
                },
                userToken: {
                    name: 'ut',
                    domain: 'example.com',
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 0,
                },
                previewToken: {
                    name: 'pt',
                    domain: 'example.com',
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 0,
                },
            },
            eventProcessor: jest.fn(),
        }],
    ])('should allow %s', value => {
        function validate(): void {
            sdkConfigurationSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
            },
            "Missing property '/appId'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                disableCidMirroring: true,
                debug: true,
                test: true,
            },
            "Missing property '/tokenScope'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                debug: true,
                test: true,
            },
            "Missing property '/disableCidMirroring'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                test: true,
            },
            "Missing property '/debug'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                clientId: '7e9d59a9',
            },
            "Invalid format at path '/clientId'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                disableCidMirroring: true,
                debug: true,
                test: true,
                tokenScope: 'x',
            },
            "Unexpected value at path '/tokenScope', expecting 'global', 'contextual' or 'isolated', found 'x'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                test: true,
                debug: 'foo',
            },
            "Expected value of type boolean at path '/debug', actual string.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: 'foo',
            },
            "Expected value of type boolean at path '/test', actual string.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                baseEndpointUrl: 'foo',
            },
            "Invalid url format at path '/baseEndpointUrl'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                cidAssignerEndpointUrl: 'foo',
            },
            "Invalid url format at path '/cidAssignerEndpointUrl'.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                beaconQueueSize: -1,
            },
            "Expected a value greater than or equal to 0 at path '/beaconQueueSize', actual -1.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                beaconQueueSize: 1.2,
            },
            "Expected value of type integer at path '/beaconQueueSize', actual number.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                eventMetadata: {foo: 1},
            },
            "Expected value of type string at path '/eventMetadata/foo', actual integer.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                logger: null,
            },
            "Expected value of type object at path '/logger', actual null.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                cookie: null,
            },
            "Expected value of type object at path '/cookie', actual null.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                cookie: {
                    clientId: {
                        name: '',
                        domain: 'example.com',
                        path: '/',
                        secure: true,
                        sameSite: 'strict',
                        maxAge: 0,
                    },
                },
            },
            "Expected at least 1 character at path '/cookie/clientId/name', actual 0.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                cookie: {
                    userToken: {
                        name: '',
                        domain: 'example.com',
                        path: '/',
                        secure: true,
                        sameSite: 'strict',
                        maxAge: 0,
                    },
                },
            },
            "Expected at least 1 character at path '/cookie/userToken/name', actual 0.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                cookie: {
                    previewToken: {
                        name: '',
                        domain: 'example.com',
                        path: '/',
                        secure: true,
                        sameSite: 'strict',
                        maxAge: 0,
                    },
                },
            },
            "Expected at least 1 character at path '/cookie/previewToken/name', actual 0.",
        ],
        [
            {
                appId: '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a',
                tokenScope: 'global',
                disableCidMirroring: true,
                debug: true,
                test: true,
                eventProcessor: null,
            },
            "Expected value of type function at path '/eventProcessor', actual null.",
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            sdkConfigurationSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
