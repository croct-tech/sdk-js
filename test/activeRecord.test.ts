import {ActiveRecord} from '../src/activeRecord';
import type {Patch} from '../src/patch';

class TestRecord extends ActiveRecord<any> {
    public save(): Promise<any> {
        return Promise.resolve(this);
    }

    public reset(): this {
        return super.reset();
    }

    public buildPatch(): Patch {
        return super.buildPatch();
    }

    public isDirty(): boolean {
        return super.isDirty();
    }
}

describe('An active record', () => {
    it('should build a patch', () => {
        const record = new TestRecord()
            .set('a', 1)
            .set({a: 1})
            .add('b', '2')
            .combine('c', '3')
            .merge('d', [4])
            .merge({d: [4]})
            .increment('e', 5)
            .decrement('f', 6)
            .clear('g')
            .unset('h')
            .remove('i', 1)
            .buildPatch();

        const operations: Patch = {
            operations: [
                {
                    type: 'set',
                    path: 'a',
                    value: 1,
                },
                {
                    type: 'set',
                    path: '.',
                    value: {a: 1},
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
                    value: [4],
                },
                {
                    type: 'merge',
                    path: '.',
                    value: {d: [4]},
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
                {
                    type: 'remove',
                    path: 'i',
                    value: 1,
                },
            ],
        };

        expect(record).toEqual(operations);
    });

    it('should determine whether the record has pending changes', () => {
        const record = new TestRecord();

        expect(record.isDirty()).toBeFalsy();

        record.set('a', '1');

        expect(record.isDirty()).toBeTruthy();
    });

    it('should allow discarding pending changes', () => {
        const record = new TestRecord();

        record.set('a', '1');

        expect(record.isDirty()).toBeTruthy();

        record.reset();

        expect(record.isDirty()).toBeFalsy();
    });
});
