import {getLength, getLocation, getPosition} from '../src/sourceLocation';

describe('The string length function', () => {
    test.each([
        ['What if\nwe could\ndo this?', 25],
        ['What if\r\nwe could\r\ndo this?', 27],
        ['foo', 3],
        ['🐊', 1],
        ['I 💚 🐊', 5],
        ['', 0],
    ])('should compute that the length of the string "%s" is %d', (input: string, length: number) => {
        expect(getLength(input)).toBe(length);
    });
});

describe('The string position function', () => {
    test.each([
        [0, 'What if\nwe could\ndo this?', {line: 1, column: 0, index: 0}],
        [7, 'What if\nwe could\ndo this?', {line: 1, column: 7, index: 7}],
        [8, 'What if\nwe could\ndo this?', {line: 2, column: 0, index: 8}],
        [9, 'What if\nwe could\ndo this?', {line: 2, column: 1, index: 9}],
        [9, 'What if\r\nwe could\r\ndo this?', {line: 2, column: 0, index: 9}],
        [0, 'foo', {line: 1, column: 0, index: 0}],
        [2, 'foo', {line: 1, column: 2, index: 2}],
        [0, '🐊', {line: 1, column: 0, index: 0}],
        [1, '🐊', {line: 1, column: 1, index: 1}],
        [2, 'I 💚 🐊', {line: 1, column: 2, index: 2}],
        [3, 'I 💚 🐊', {line: 1, column: 3, index: 3}],
        [5, 'I 💚 🐊', {line: 1, column: 5, index: 5}],
        [0, '', {line: 1, column: 0, index: 0}],
    ])(
        'should compute that the position of the character %s in "%s" is %o',
        (index: number, input: string, position: any) => {
            expect(getPosition(input, index)).toEqual(position);
        },
    );
});

describe('The string location function', () => {
    test.each([
        [
            0,
            10,
            'What if\nwe could\ndo this?',
            {start: {line: 1, column: 0, index: 0}, end: {line: 2, column: 2, index: 10}},
        ],
        [
            0,
            2,
            'foo',
            {start: {line: 1, column: 0, index: 0}, end: {line: 1, column: 2, index: 2}},
        ],
        [
            0,
            1,
            '🐊',
            {start: {line: 1, column: 0, index: 0}, end: {line: 1, column: 1, index: 1}},
        ],
        [
            2,
            5,
            'I 💚 🐊',
            {start: {line: 1, column: 2, index: 2}, end: {line: 1, column: 5, index: 5}},
        ],
        [
            0,
            0,
            '',
            {start: {line: 1, column: 0, index: 0}, end: {line: 1, column: 0, index: 0}},
        ],
    ])('should compute that the location of the substring between the characters %s and %s in "%s" is %o', (
        start: number,
        end: number,
        input: string,
        location: any,
    ) => {
        expect(getLocation(input, start, end)).toEqual(location);
    });

    test('should fail if the start index is negative', () => {
        function location(): void {
            getLocation('foo', -1, 0)
        }

        expect(location).toThrow(Error);
        expect(location).toThrow('The start index cannot be negative.');
    });

    test('should fail if the start index is greater than end index', () => {
        function location(): void {
            getLocation('foo', 1, 0)
        }

        expect(location).toThrow(Error);
        expect(location).toThrow('The end index must greater than or equal to the start index.');
    });
});
