import * as fetchMock from 'fetch-mock';
import {HttpChannel} from "../../src/channel/httpChannel";

afterEach(fetchMock.restore);

test('should send a request ', async () => {
    let fulfill: (response: {}) => void = () => {};

    fetchMock.mock('/endpoint', new Promise<{}>(resolve => {
        fulfill = resolve;
    }));

    const channel = new HttpChannel({url: '/endpoint'});

    const listener = jest.fn();

    channel.subscribe(listener);

    const promise = channel.publish('ping');

    expect(listener).not.toHaveBeenCalled();

    fulfill({status: 200, body: 'pong'});

    await expect(promise).resolves.toBeUndefined();

    expect(listener).toHaveBeenCalledWith({
        asymmetricMatch: async (actual: Response) => {
            return actual.status === 200 && await actual.text() === 'pong';
        }
    });
});