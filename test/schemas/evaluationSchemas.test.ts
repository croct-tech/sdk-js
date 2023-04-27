import {evaluationOptionsSchema} from '../../src/schema';
import {EvaluationOptions} from '../../src/facade/evaluatorFacade';

describe('The evaluation option schema', () => {
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
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            evaluationOptionsSchema.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
