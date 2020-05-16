import Logger from './index';

export default class NullLogger implements Logger {
    public debug(): void {
        // suppress debug logs
    }

    public info(): void {
        // suppress info logs
    }

    public warn(): void {
        // suppress warning logs
    }

    public error(): void {
        // suppress error logs
    }
}
