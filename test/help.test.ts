import type {ApiProblem} from '../src/error';
import {Help} from '../src/help';

describe('A function to provide help for errors', () => {
    type StatusCodeScenario = {
        status: number,
        help: string,
    };

    it.each<StatusCodeScenario>([
        {
            status: 202,
            help: 'https://croct.help/sdk/javascript/suspended-service',
        },
        {
            status: 401,
            help: 'https://croct.help/sdk/javascript/invalid-credentials',
        },
        {
            status: 408,
            help: 'https://croct.help/sdk/javascript/request-timeout',
        },
    ])('should provide help for status code %i', scenario => {
        expect(Help.forStatusCode(scenario.status)).toContain(scenario.help);
    });

    it('should return undefined for status codes without help', () => {
        expect(Help.forStatusCode(999)).toBeUndefined();
    });

    type ApiProblemScenario = {
        problem: ApiProblem,
        help: string,
    };

    it.each<ApiProblemScenario>([
        {
            problem: {
                type: 'https://croct.help/api/some-error',
                title: 'Service is suspended.',
                status: 202,
            },
            help: 'https://croct.help/sdk/javascript/suspended-service',
        },
        {
            problem: {
                type: 'https://croct.help/api/some-error',
                title: 'Unauthorized request.',
                status: 401,
            },
            help: 'https://croct.help/sdk/javascript/invalid-credentials',
        },
        {
            problem: {
                type: 'https://croct.help/api/some-error',
                title: 'Request timed out.',
                status: 408,
            },
            help: 'https://croct.help/sdk/javascript/request-timeout',
        },
        {
            problem: {
                type: 'https://croct.help/api/authentication/forbidden-origin',
                title: 'Unallowed origin.',
                status: 403,
            },
            help: 'https://croct.help/sdk/javascript/unauthorized-origin',
        },
        {
            problem: {
                type: 'https://croct.help/api/authentication/quota-exceeded',
                title: 'Quota exceeded.',
                status: 403,
            },
            help: 'https://croct.help/sdk/javascript/mau-exceeded',
        },
    ])('should provide help for the API problem $problem.type', scenario => {
        expect(Help.forApiProblem(scenario.problem)).toContain(scenario.help);
    });

    it('should prioritize the error type help', () => {
        expect(Help.forApiProblem({
            type: 'https://croct.help/api/authentication/quota-exceeded',
            title: 'Unauthorized request.',
            status: 401,
        })).toContain('https://croct.help/sdk/javascript/mau-exceeded');
    });

    it('should return undefined for API problems without help', () => {
        expect(Help.forApiProblem({
            type: 'https://croct.help/api/some-error',
            title: 'Some error.',
            status: 500,
        })).toBeUndefined();
    });
});
