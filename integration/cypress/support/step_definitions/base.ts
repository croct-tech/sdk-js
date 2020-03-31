import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { WebBridgeServer } from '../mocks/websocket';


When('nothing is done for {int} seconds', (seconds: number) => {
    cy.tick(seconds * 1000)
        .wait(1000, {log: false});
});

const messageTypeCounter: { [k: string]: number } = {};

Then('{int} {word} events are emitted', eventsEmitted);
Then('1 {word} event is emitted', (eventName: string) => eventsEmitted(1, eventName));

function eventsEmitted(amount: number, eventName: string) {
    const expectedAmount = (messageTypeCounter[eventName] ?? 0) + amount;
    cy.get<WebBridgeServer>('@server')
        .then(server => server.messagesByEvent)
        .its(eventName)
        .should('have.lengthOf', expectedAmount);
    messageTypeCounter[eventName] = expectedAmount;
}

Then('client is bootstrapped', () => {
    cy.get('@fetchStub')
        .should(
            'have.been.calledWith',
            'https://main.test.croct.tech/client/web/bootstrap',
        );
});
