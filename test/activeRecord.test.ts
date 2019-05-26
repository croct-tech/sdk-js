import ActiveRecord from '../src/activeRecord';
import {Patch} from '../src/patch';

class TestRecord extends ActiveRecord<any> {
    public save(): Promise<any> {
        return Promise.resolve(this);
    }

    public buildPatch(): Patch {
        return super.buildPatch();
    }

    public isDirty(): boolean {
        return super.isDirty();
    }
}

describe('An active record', () => {
    test.each([
        [(): void => {
            new TestRecord().set('foo.', {});
        }],
        [(): void => {
            new TestRecord().add('foo.', {});
        }],
        [(): void => {
            new TestRecord().add('foo.', {});
        }],
        [(): void => {
            new TestRecord().combine('foo.', {});
        }],
        [(): void => {
            new TestRecord().merge('foo.', {});
        }],
        [(): void => {
            new TestRecord().increment('foo.', 1);
        }],
        [(): void => {
            new TestRecord().decrement('foo.', 2);
        }],
        [(): void => {
            new TestRecord().clear('foo.');
        }],
        [(): void => {
            new TestRecord().unset('foo.');
        }],
    ])('should not allow invalid paths', (operation: () => void) => {
        expect(operation).toThrow(Error);
        expect(operation).toThrow("Invalid format at path '/path'.");
    });

    test('should build a patch', () => {
        const record = new TestRecord()
            .set('a', '1')
            .add('b', '2')
            .combine('c', '3')
            .merge('d', ['4'])
            .increment('e', 5)
            .decrement('f', 6)
            .clear('g')
            .unset('h')
            .buildPatch();

        const operations: Patch = {
            operations: [
                {
                    type: 'set',
                    path: 'a',
                    value: '1',
                },
                {
                    type: 'add',
                    path: 'b',
                    value: '2',
                },
                {
                    type: 'combine',
                    path: 'c',
                    value: '3',
                },
                {
                    type: 'merge',
                    path: 'd',
                    value: ['4'],
                },
                {
                    type: 'increment',
                    path: 'e',
                    value: 5,
                },
                {
                    type: 'decrement',
                    path: 'f',
                    value: 6,
                },
                {
                    type: 'clear',
                    path: 'g',
                },
                {
                    type: 'unset',
                    path: 'h',
                },
            ],
        };

        expect(record).toEqual(operations);
    });

    test('should determine whether the record has pending changes', () => {
        const record = new TestRecord();

        expect(record.isDirty()).toBeFalsy();

        record.set('a', '1');

        expect(record.isDirty()).toBeTruthy();
    });

    test('should allow discarding pending changes', () => {
        const record = new TestRecord();

        record.set('a', '1');

        expect(record.isDirty()).toBeTruthy();

        record.reset();

        expect(record.isDirty()).toBeFalsy();
    });
});
