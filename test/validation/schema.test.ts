import {Violation} from '../../src/validation';

describe('A violation', () => {
    test('should provide the value path', () => {
        const violation = new Violation('This is a message.', ['foo', 'bar', 'baz'], {});

        expect(violation.path).toEqual(['foo', 'bar', 'baz']);
    });

    test('should provide the violation parameters', () => {
        const violation = new Violation('This is a message.', [], {first: '1', second: '2'});

        expect(violation.params).toEqual({first: '1', second: '2'});
    });
});
