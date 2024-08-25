export namespace Help {
  export function forStatusCode(statusCode: number): string|undefined {
      switch (statusCode) {
          case 401:
              return 'The request was not authorized, most likely due to invalid credentials. '
                  + 'For help, see https://croct.help/sdk/js/invalid-credentials';

          case 403:
              return 'The origin of the request is not allowed in your application settings. '
                  + 'For help, see https://croct.help/sdk/js/cors';

          case 408:
              return 'The request timed out. '
                    + 'For help, see https://croct.help/sdk/js/timeout';

          case 423:
              return 'The application has exceeded the monthly active users (MAU) quota. '
                  + 'For help, see https://croct.help/sdk/js/mau-exceeded';

          default:
              return undefined;
      }
  }
}
