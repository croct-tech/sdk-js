import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { WebBridgeServer } from '../mocks/websocket';


When(/^nothing is done for (\d+) seconds$/i, (seconds: string) => {
    cy.tick(parseInt(seconds, 10) * 1000);
});

const messageTypeCounter: { [k: string]: number } = {};

Then(/^(\d+) (\w+) events? is emitted$/i, (amount: string, eventName: string) => {
    const expectedAmount = (messageTypeCounter[eventName] ?? 0) + parseInt(amount, 10);
    expect(WebBridgeServer.messagesByEvent[eventName]).to.have.lengthOf(expectedAmount);
    messageTypeCounter[eventName] = expectedAmount;
});

Then('client is bootstrapped', () => {
    cy.get('@fetchStub')
        .should(
            'have.been.calledWith',
            'https://main.test.croct.tech/client/web/bootstrap',
        );
});
