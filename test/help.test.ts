import {Help} from '../src/help';

describe('A function to provide help for errors', () => {
    type StatusCodeScenario = {
        status: number,
        help: string,
    };

    it.each<StatusCodeScenario>([
        {
            status: 401,
            help: 'https://croct.help/sdk/javascript/invalid-credentials',
        },
        {
            status: 403,
            help: 'https://croct.help/sdk/javascript/unauthorized-origin',
        },
        {
            status: 408,
            help: 'https://croct.help/sdk/javascript/request-timeout',
        },
        {
            status: 423,
            help: 'https://croct.help/sdk/javascript/mau-exceeded',
        },
    ])('should provide help for status code %i', scenario => {
        expect(Help.forStatusCode(scenario.status)).toContain(scenario.help);
    });

    it('should return undefined for status codes without help', () => {
        expect(Help.forStatusCode(999)).toBeUndefined();
    });
});
