import { Before, Given } from 'cypress-cucumber-preprocessor/steps';
import TestBench from '../connections/testBench';
import { acceptAllMessages, rejectAllMessages, WebBridgeServer } from '../mocks/websocket';

Before(() => {
    cy.clock();
});

Given('a compatible bridge', () => {
    WebBridgeServer.setAnswerer(acceptAllMessages);
});

Given('an incompatible bridge', () => {
    WebBridgeServer.setAnswerer(rejectAllMessages);
});

Given('an ignoring bridge', () => {
    WebBridgeServer.setAnswerer(undefined);
});

Given(/I'm at the test bench/, () => {
    TestBench.start();
});
