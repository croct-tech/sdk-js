const JSDOMEnvironment = require('jest-environment-jsdom').default;

class CustomJSDOMEnvironment extends JSDOMEnvironment {
    constructor(...args) {
        super(...args);

        this.global.ReadableStream = ReadableStream;
        this.global.Request = Request;
        this.global.Response = Response;
        this.global.fetch = fetch;
    }
}

module.exports = CustomJSDOMEnvironment;
