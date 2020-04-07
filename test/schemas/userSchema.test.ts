import {userProfileSchema} from '../../src/schema/userSchema';

describe('The user profile schema', () => {
    test.each([
        [{firstName: 'x'}],
        [{firstName: 'x'.repeat(50)}],
        [{lastName: 'x'}],
        [{lastName: 'x'.repeat(50)}],
        [{birthDate: '2015-08-31'}],
        [{gender: 'male'}],
        [{gender: 'female'}],
        [{gender: 'neutral'}],
        [{gender: 'unknown'}],
        [{email: 'x'}],
        [{email: 'x'.repeat(254)}],
        [{alternateEmail: 'x'}],
        [{alternateEmail: 'x'.repeat(254)}],
        [{phone: 'x'}],
        [{phone: 'x'.repeat(30)}],
        [{alternatePhone: 'x'}],
        [{alternatePhone: 'x'.repeat(30)}],
        [{address: {}}],
        [{address: {street: 'x'}}],
        [{address: {street: 'x'.repeat(100)}}],
        [{address: {district: 'x'}}],
        [{address: {district: 'x'.repeat(100)}}],
        [{address: {city: 'x'}}],
        [{address: {city: 'x'.repeat(100)}}],
        [{address: {region: 'x'}}],
        [{address: {region: 'x'.repeat(100)}}],
        [{address: {country: 'x'}}],
        [{address: {country: 'x'.repeat(100)}}],
        [{address: {postalCode: 'x'}}],
        [{address: {postalCode: 'x'.repeat(20)}}],
        [{avatar: 'http://www.foo.com'}],
        [{avatar: `http://www.${'x'.repeat(485)}.com`}],
        [{company: 'x'}],
        [{company: 'x'.repeat(200)}],
        [{companyUrl: 'http://www.foo.com'}],
        [{companyUrl: `http://www.${'x'.repeat(185)}.com`}],
        [{jobTitle: 'x'}],
        [{jobTitle: 'x'.repeat(50)}],
        [{
            custom: {
                integer: 1,
                number: 1.2,
                null: null,
                true: true,
                false: false,
                emptyString: '',
                longString: 'x'.repeat(100),
                array: [1, 1.2, null, true, false, '', 'x'.repeat(100)],
                map: {
                    integer: 1,
                    number: 1.2,
                    null: null,
                    true: true,
                    false: false,
                    emptyString: '',
                    longString: 'x'.repeat(100),
                },
            },
        }],
        [{custom: {looongKeyWith20Chars: 'x'}}],
        [{custom: {array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}}],
        [{
            custom: {
                a: 1,
                b: 2,
                c: 3,
                d: 4,
                e: 5,
                f: 6,
                g: 7,
                h: 8,
                i: 9,
                j: 10,
            },
        }],
        [{
            custom: {
                map: {
                    a: 1,
                    b: 2,
                    c: 3,
                    d: 4,
                    e: 5,
                    f: 6,
                    g: 7,
                    h: 8,
                    i: 9,
                    j: 10,
                },
            },
        }],
    ])('should allow %s', (value: object) => {
        function validate(): void {
            userProfileSchema.validate(value);
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [{firstName: ''}, 'Expected at least 1 character at path \'/firstName\', actual 0.'],
        [{firstName: 'x'.repeat(51)}, 'Expected at most 50 characters at path \'/firstName\', actual 51.'],
        [{lastName: ''}, 'Expected at least 1 character at path \'/lastName\', actual 0.'],
        [{lastName: 'x'.repeat(51)}, 'Expected at most 50 characters at path \'/lastName\', actual 51.'],
        [{birthDate: 'foo'}, 'Invalid date format at path \'/birthDate\'.'],
        [
            {gender: 'foo'},
            'Unexpected value at path \'/gender\', expecting \'male\', \'female\', \'neutral\' '
            + 'or \'unknown\', found \'foo\'.',
        ],
        [{email: ''}, 'Expected at least 1 character at path \'/email\', actual 0.'],
        [{email: 'x'.repeat(255)}, 'Expected at most 254 characters at path \'/email\', actual 255.'],
        [{alternateEmail: ''}, 'Expected at least 1 character at path \'/alternateEmail\', actual 0.'],
        [{alternateEmail: 'x'.repeat(255)}, 'Expected at most 254 characters at path \'/alternateEmail\', actual 255.'],
        [{phone: ''}, 'Expected at least 1 character at path \'/phone\', actual 0.'],
        [{phone: 'x'.repeat(31)}, 'Expected at most 30 characters at path \'/phone\', actual 31.'],
        [{alternatePhone: ''}, 'Expected at least 1 character at path \'/alternatePhone\', actual 0.'],
        [{alternatePhone: 'x'.repeat(31)}, 'Expected at most 30 characters at path \'/alternatePhone\', actual 31.'],
        [{address: {street: ''}}, 'Expected at least 1 character at path \'/address/street\', actual 0.'],
        [
            {address: {street: 'x'.repeat(101)}},
            'Expected at most 100 characters at path \'/address/street\', actual 101.',
        ],
        [{address: {district: ''}}, 'Expected at least 1 character at path \'/address/district\', actual 0.'],
        [
            {address: {district: 'x'.repeat(101)}},
            'Expected at most 100 characters at path \'/address/district\', actual 101.',
        ],
        [{address: {city: ''}}, 'Expected at least 1 character at path \'/address/city\', actual 0.'],
        [{address: {city: 'x'.repeat(101)}}, 'Expected at most 100 characters at path \'/address/city\', actual 101.'],
        [{address: {region: ''}}, 'Expected at least 1 character at path \'/address/region\', actual 0.'],
        [
            {address: {region: 'x'.repeat(101)}},
            'Expected at most 100 characters at path \'/address/region\', actual 101.',
        ],
        [{address: {country: ''}}, 'Expected at least 1 character at path \'/address/country\', actual 0.'],
        [
            {address: {country: 'x'.repeat(101)}},
            'Expected at most 100 characters at path \'/address/country\', actual 101.',
        ],
        [{address: {postalCode: ''}}, 'Expected at least 1 character at path \'/address/postalCode\', actual 0.'],
        [
            {address: {postalCode: 'x'.repeat(21)}},
            'Expected at most 20 characters at path \'/address/postalCode\', actual 21.',
        ],
        [{avatar: 'foo'}, 'Invalid url format at path \'/avatar\'.'],
        [
            {avatar: `http://www.${'x'.repeat(486)}.com`},
            'Expected at most 500 characters at path \'/avatar\', actual 501.',
        ],
        [{company: ''}, 'Expected at least 1 character at path \'/company\', actual 0.'],
        [{company: 'x'.repeat(201)}, 'Expected at most 200 characters at path \'/company\', actual 201.'],
        [{companyUrl: 'foo'}, 'Invalid url format at path \'/companyUrl\'.'],
        [
            {companyUrl: `http://www.${'x'.repeat(186)}.com`},
            'Expected at most 200 characters at path \'/companyUrl\', actual 201.',
        ],
        [{jobTitle: ''}, 'Expected at least 1 character at path \'/jobTitle\', actual 0.'],
        [{jobTitle: 'x'.repeat(51)}, 'Expected at most 50 characters at path \'/jobTitle\', actual 51.'],
        [
            {custom: {longString: 'x'.repeat(101)}},
            'Expected at most 100 characters at path \'/custom/longString\', actual 101.',
        ],
        [
            {custom: {looooooooooooooongKey: 'x'}},
            'Expected at most 20 characters at path \'/custom/looooooooooooooongKey\', actual 21.',
        ],
        [
            {custom: {map: {looooooooooooooongKey: 'x'}}},
            'Expected at most 20 characters at path \'/custom/map/looooooooooooooongKey\', actual 21.',
        ],
        [
            {custom: {'@foo': 1}},
            'Invalid identifier format at path \'/custom/@foo\'.',
        ],
        [
            {custom: {map: {'@foo': 1}}},
            'Invalid identifier format at path \'/custom/map/@foo\'.',
        ],
        [
            {custom: {nestedArrayInArray: [[1, 2, 3]]}},
            'Expected value of type boolean, null, number or string at path '
            + '\'/custom/nestedArrayInArray/0\', actual array.',
        ],
        [
            {custom: {nestedArrayInMap: {foo: [1, 2, 3]}}},
            'Expected value of type boolean, null, number or string at path '
            + '\'/custom/nestedArrayInMap/foo\', actual array.',
        ],
        [
            {custom: {nestedMapInArray: [{foo: 'bar'}]}},
            'Expected value of type boolean, null, number or string at path '
            + '\'/custom/nestedMapInArray/0\', actual Object.',
        ],
        [
            {custom: {nestedMapInMap: {foo: {bar: 'baz'}}}},
            'Expected value of type boolean, null, number or string at path '
            + '\'/custom/nestedMapInMap/foo\', actual Object.',
        ],
        [
            {
                custom: {
                    a: 1,
                    b: 2,
                    c: 3,
                    d: 4,
                    e: 5,
                    f: 6,
                    g: 7,
                    h: 8,
                    i: 9,
                    j: 10,
                    k: 11,
                },
            },
            'Expected at most 10 entries at path \'/custom\', actual 11.',
        ],
        [
            {
                custom: {
                    map: {
                        a: 1,
                        b: 2,
                        c: 3,
                        d: 4,
                        e: 5,
                        f: 6,
                        g: 7,
                        h: 8,
                        i: 9,
                        j: 10,
                        k: 11,
                    },
                },
            },
            'Expected at most 10 entries at path \'/custom/map\', actual 11.',
        ],
        [
            {custom: {array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}},
            'Expected at most 10 items at path \'/custom/array\', actual 11.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            userProfileSchema.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
