import {
    addOperation,
    clearOperation,
    combineOperation,
    decrementOperation,
    incrementOperation,
    mergeOperation,
    setOperation,
    unsetOperation,
} from '../../src/schema/operationSchemas';

const simpleArray = [1, 1.2, null, 'foo', true];

const simpleMap = {
    a: 1,
    b: 1.2,
    c: null,
    d: 'foo',
    e: true,
};

const complexMap = {
    a: 1,
    b: 1.2,
    c: null,
    d: 'foo',
    e: true,
    f: simpleArray,
    g: simpleMap,
};

describe('An add operation schema', () => {
    test.each([
        [1],
        [1.2],
        [null],
        ['foo'],
        [true],
        [simpleArray],
        [simpleMap],
        [complexMap],
    ])('should allow value %s', (value: any) => {
        function validate(): void {
            addOperation.validate({path: 'foo', value: value});
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [
            [['foo']],
            'Expected a JSON primitive at path \'/value/0\', actual array.',
        ],
        [
            {map: {map: {foo: 1}}},
            'Expected a JSON primitive at path \'/value/map/map\', actual Object.',
        ],
        [
            {map: {list: ['foo']}},
            'Expected a JSON primitive at path \'/value/map/list\', actual array.',
        ],
        [
            /not-a-json-value/,
            'Expected value of type null, number, string, boolean, array or object at path \'/value\', actual RegExp.',
        ],
    ])('should not allow value %s', (value: any, message: string) => {
        function validate(): void {
            addOperation.validate({path: 'foo', value: value});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });

    test('should fail if path is invalid', () => {
        function validate(): void {
            addOperation.validate({path: 'foo.', value: 'bar'});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Invalid pointer format at path \'/path\'.');
    });
});

describe('A set operation schema', () => {
    test.each([
        [1],
        [1.2],
        [null],
        ['foo'],
        [true],
        [simpleArray],
        [simpleMap],
        [complexMap],
    ])('should allow value %s', (value: any) => {
        function validate(): void {
            setOperation.validate({path: 'foo', value: value});
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [
            [['foo']],
            'Expected a JSON primitive at path \'/value/0\', actual array.',
        ],
        [
            {map: {map: {foo: 1}}},
            'Expected a JSON primitive at path \'/value/map/map\', actual Object.',
        ],
        [
            {map: {list: ['foo']}},
            'Expected a JSON primitive at path \'/value/map/list\', actual array.',
        ],
        [
            /not-a-json-value/,
            'Expected value of type null, number, string, boolean, array or object at path \'/value\', actual RegExp.',
        ],
    ])('should not allow value %s', (value: any, message: string) => {
        function validate(): void {
            setOperation.validate({path: 'foo', value: value});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });

    test('should fail if path is invalid', () => {
        function validate(): void {
            setOperation.validate({path: 'foo.', value: 'bar'});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Invalid pointer format at path \'/path\'.');
    });
});

describe('A combine operation schema', () => {
    test.each([
        [1],
        [1.2],
        [null],
        ['foo'],
        [true],
        [simpleArray],
        [simpleMap],
        [complexMap],
    ])('should allow value %s', (value: any) => {
        function validate(): void {
            combineOperation.validate({path: 'foo', value: value});
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [
            [['foo']],
            'Expected a JSON primitive at path \'/value/0\', actual array.',
        ],
        [
            {map: {map: {foo: 1}}},
            'Expected a JSON primitive at path \'/value/map/map\', actual Object.',
        ],
        [
            {map: {list: ['foo']}},
            'Expected a JSON primitive at path \'/value/map/list\', actual array.',
        ],
        [
            /not-a-json-value/,
            'Expected value of type null, number, string, boolean, array or object at path \'/value\', actual RegExp.',
        ],
    ])('should not allow value %s', (value: any, message: string) => {
        function validate(): void {
            combineOperation.validate({path: 'foo', value: value});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });

    test('should fail if path is invalid', () => {
        function validate(): void {
            combineOperation.validate({path: 'foo.', value: 'bar'});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Invalid pointer format at path \'/path\'.');
    });
});

describe('A merge operation schema', () => {
    test.each([
        [simpleArray],
        [simpleMap],
        [complexMap],
    ])('should allow value %s', (value: any) => {
        function validate(): void {
            mergeOperation.validate({path: 'foo', value: value});
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [1, 'Expected value of type array or object at path \'/value\', actual integer.'],
        [1.2, 'Expected value of type array or object at path \'/value\', actual number.'],
        [null, 'Expected value of type array or object at path \'/value\', actual null.'],
        ['foo', 'Expected value of type array or object at path \'/value\', actual string.'],
        [true, 'Expected value of type array or object at path \'/value\', actual boolean.'],
        [
            [['foo']],
            'Expected a JSON primitive at path \'/value/0\', actual array.',
        ],
        [
            {map: {map: {foo: 1}}},
            'Expected a JSON primitive at path \'/value/map/map\', actual Object.',
        ],
        [
            {map: {list: ['foo']}},
            'Expected a JSON primitive at path \'/value/map/list\', actual array.',
        ],
        [/not-a-json-value/, 'Expected value of type array or object at path \'/value\', actual RegExp.'],
    ])('should not allow value %s', (value: any, message: string) => {
        function validate(): void {
            mergeOperation.validate({path: 'foo', value: value});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });

    test('should fail if path is invalid', () => {
        function validate(): void {
            mergeOperation.validate({path: 'foo.', value: 'bar'});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Invalid pointer format at path \'/path\'.');
    });
});

describe('An increment operation schema', () => {
    test.each([
        [1],
        [1.2],
    ])('should allow value %s', (value: any) => {
        function validate(): void {
            incrementOperation.validate({path: 'foo', value: value});
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [null, 'Expected value of type number at path \'/value\', actual null.'],
        ['foo', 'Expected value of type number at path \'/value\', actual string.'],
        [true, 'Expected value of type number at path \'/value\', actual boolean.'],
        [simpleArray, 'Expected value of type number at path \'/value\', actual array.'],
        [simpleMap, 'Expected value of type number at path \'/value\', actual Object.'],
        [complexMap, 'Expected value of type number at path \'/value\', actual Object.'],
        [/not-a-json-value/, 'Expected value of type number at path \'/value\', actual RegExp.'],
    ])('should not allow value %s', (value: any, message: string) => {
        function validate(): void {
            incrementOperation.validate({path: 'foo', value: value});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });

    test('should fail if path is invalid', () => {
        function validate(): void {
            incrementOperation.validate({path: 'foo.', value: 1});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Invalid pointer format at path \'/path\'.');
    });
});

describe('A decrement operation schema', () => {
    test.each([
        [1],
        [1.2],
    ])('should allow value %s', (value: any) => {
        function validate(): void {
            decrementOperation.validate({path: 'foo', value: value});
        }

        expect(validate).not.toThrowError(Error);
    });

    test.each([
        [null, 'Expected value of type number at path \'/value\', actual null.'],
        ['foo', 'Expected value of type number at path \'/value\', actual string.'],
        [true, 'Expected value of type number at path \'/value\', actual boolean.'],
        [simpleArray, 'Expected value of type number at path \'/value\', actual array.'],
        [simpleMap, 'Expected value of type number at path \'/value\', actual Object.'],
        [complexMap, 'Expected value of type number at path \'/value\', actual Object.'],
        [/not-a-json-value/, 'Expected value of type number at path \'/value\', actual RegExp.'],
    ])('should not allow value %s', (value: any, message: string) => {
        function validate(): void {
            decrementOperation.validate({path: 'foo', value: value});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });

    test('should fail if path is invalid', () => {
        function validate(): void {
            decrementOperation.validate({path: 'foo.', value: 1});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Invalid pointer format at path \'/path\'.');
    });
});

describe('A clear operation schema', () => {
    test('should fail if path is invalid', () => {
        function validate(): void {
            clearOperation.validate({path: 'foo.'});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Invalid pointer format at path \'/path\'.');
    });
});

describe('An unset operation schema', () => {
    test('should fail if path is invalid', () => {
        function validate(): void {
            unsetOperation.validate({path: 'foo.'});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Invalid pointer format at path \'/path\'.');
    });
});
