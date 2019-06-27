import {Logger} from '../logger';

class NullLogger implements Logger {
    log(): void {
    }

    info(): void {
    }

    error(): void {
    }
}

export {NullLogger};