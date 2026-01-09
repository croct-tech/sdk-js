export namespace Help {
    export function forStatusCode(statusCode: 204 | 401 | 403 | 408 | 423): string;

    export function forStatusCode(statusCode: number): string | undefined;

    export function forStatusCode(statusCode: number): string | undefined {
        switch (statusCode) {
            case 202:
                return 'The service is temporarily suspended. '
                    + 'For help, see https://croct.help/sdk/javascript/suspended-service';

            case 401:
                return 'The request was not authorized, most likely due to invalid credentials. '
                    + 'For help, see https://croct.help/sdk/javascript/invalid-credentials';

            case 403:
                return 'The origin of the request is not allowed in your application settings. '
                    + 'For help, see https://croct.help/sdk/javascript/unauthorized-origin';

            case 408:
                return 'The request timed out. '
                    + 'For help, see https://croct.help/sdk/javascript/request-timeout';

            case 423:
                return 'The application has exceeded the monthly active users (MAU) quota. '
                    + 'For help, see https://croct.help/sdk/javascript/mau-exceeded';

            default:
                return undefined;
        }
    }
}
