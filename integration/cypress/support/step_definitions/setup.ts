import { Before, Given } from 'cypress-cucumber-preprocessor/steps';
import { v4 as uuid } from 'uuid';
import TestBench from '../connections/testBench';
import { acceptAllMessages, rejectAllMessages, WebBridgeServer } from '../mocks/websocket';

Before(() => {
    cy.clock();
    const appId = uuid();
    cy.wrap(appId).as('appId');
    cy.wrap(new WebBridgeServer(appId)).as('server').wait(1000, {log: false});
});

Given('a compatible bridge', () => {
    cy.get<WebBridgeServer>('@server')
        .then(server => server.setAnswerer(acceptAllMessages));
});

Given('an incompatible bridge', () => {
    cy.get<WebBridgeServer>('@server')
        .then(server => server.setAnswerer(rejectAllMessages));
});

Given('an ignoring bridge', () => {
    cy.get<WebBridgeServer>('@server')
        .then(server => server.setAnswerer(undefined));
});

Given(/I'm at the test bench/, () => {
    cy.get<string>('@appId')
        .then(appId => TestBench.start(appId));
});
