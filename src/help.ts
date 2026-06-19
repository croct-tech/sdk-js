import type {ApiProblem} from './error';

enum AuthErrorType {
    FORBIDDEN_ORIGIN = 'https://croct.help/api/authentication/forbidden-origin',
    QUOTA_EXCEEDED = 'https://croct.help/api/authentication/quota-exceeded',
}

export namespace Help {
    export function forApiProblem(problem: ApiProblem): string | undefined {
        switch (problem.type) {
            case AuthErrorType.FORBIDDEN_ORIGIN:
                return 'The origin of the request is not allowed in your application settings. '
                    + 'For help, see https://croct.help/sdk/javascript/unauthorized-origin';
            case AuthErrorType.QUOTA_EXCEEDED:
                return 'The application has exceeded the monthly active users (MAU) quota. '
                    + 'For help, see https://croct.help/sdk/javascript/mau-exceeded';
            default:
                return Help.forStatusCode(problem.status);
        }
    }

    export function forStatusCode(statusCode: 202 | 401 | 408): string;

    export function forStatusCode(statusCode: number): string | undefined;

    export function forStatusCode(statusCode: number): string | undefined {
        switch (statusCode) {
            case 202:
                return 'The service is temporarily suspended. '
                    + 'For help, see https://croct.help/sdk/javascript/suspended-service';

            case 401:
                return 'The request was not authorized, most likely due to invalid credentials. '
                    + 'For help, see https://croct.help/sdk/javascript/invalid-credentials';

            case 408:
                return 'The request timed out. '
                    + 'For help, see https://croct.help/sdk/javascript/request-timeout';

            default:
                return undefined;
        }
    }
}
