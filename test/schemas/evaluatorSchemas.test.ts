import {evaluationOptionsSchema} from '../../src/schema';
import {EvaluationOptions} from '../../src/facade/evaluatorFacade';

describe('The evaluator option schema', () => {
    it.each<EvaluationOptions[]>([
        [{}],
        [{
            timeout: 1,
        }],
        [{
            attributes: {foo: 'bar'},
        }],
        [{
            timeout: 1,
            attributes: {foo: 'bar'},
        }],
        [{
            timeout: 1,
            attributes: {},
        }],
        [{
            timeout: 1,
            attributes: {
                ['x'.repeat(50)]: 'x'.repeat(255),
                'multi-byte character': '♥'.repeat(255),
                arr: [
                    null,
                    123,
                    'x'.repeat(255),
                    true,
                    false,
                ],
                first: {
                    second: {
                        third: {
                            'nested array': [
                                null,
                                123,
                                'x'.repeat(255),
                                true,
                                false,
                            ],
                            fourth: {
                                fifth: '',
                            },
                        },
                    },
                },
            },
        }],
    ])('should allow %s', value => {
        function validate(): void {
            evaluationOptionsSchema.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {timeout: -1},
            'Expected a value greater than or equal to 0 at path \'/timeout\', actual -1.',
        ],
        [
            {timeout: 1.2},
            'Expected value of type integer at path \'/timeout\', actual number.',
        ],
        [
            {attributes: 0},
            'Expected a JSON object at path \'/attributes\', actual integer.',
        ],
        [
            {
                attributes: {
                    first: {
                        second: {
                            third: {
                                fourth: {
                                    fifth: {},
                                },
                            },
                        },
                    },
                },
            },
            'Expected value of type null, number, boolean or string'
            + ' at path \'/attributes/first/second/third/fourth/fifth\', actual Object.',
        ],
        [
            {
                attributes: {
                    first: [
                        [
                            [
                                [
                                    ['fifth level'],
                                ],
                            ],
                        ],
                    ],
                },
            },
            'Expected value of type null, number, boolean or string'
            + ' at path \'/attributes/first/0/0/0/0\', actual array.',
        ],
        [
            {
                attributes: {
                    foo: undefined,
                },
            },
            'Expected a JSON object at path \'/attributes\', actual Object.',
        ],
        [
            {
                attributes: {
                    '': 'foo',
                },
            },
            'Expected at least 1 character at path \'/attributes/\', actual 0.',
        ],
        [
            {
                attributes: {
                    ['x'.repeat(51)]: 'foo',
                },
            },
            `Expected at most 50 characters at path '/attributes/${'x'.repeat(51)}', actual 51.`,
        ],
        [
            {
                attributes: 'foo',
            },
            'Expected a JSON object at path \'/attributes\', actual string.',
        ],
        [
            {
                attributes: {
                    string: 'x'.repeat(256),
                },
            },
            'Expected at most 255 characters at path \'/attributes/string\', actual 256.',
        ],
        [
            {
                attributes: {
                    first: {
                        second: {
                            third: {
                                fourth: {
                                    fifth: 'x'.repeat(256),
                                },
                            },
                        },
                    },
                },
            },
            'Expected at most 255 characters at path \'/attributes/first/second/third/fourth/fifth\', actual 256.',
        ],
        [
            {
                attributes: {
                    first: [
                        [
                            [
                                [
                                    'x'.repeat(256),
                                ],
                            ],
                        ],
                    ],
                },
            },
            'Expected at most 255 characters at path \'/attributes/first/0/0/0/0\', actual 256.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            evaluationOptionsSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
