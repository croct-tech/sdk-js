import { WebSocket } from 'mock-socket';

// const BASE_TEST_BENCH_URL = './index.html';
const BASE_TEST_BENCH_URL = 'https://cdn.test.croct.tech/playground/master/index.html?appId=ac88a73c-4387-4a45-8d2d-236398bda7d9';


class TestBench {
    start() {
        cy.visit({
            url: BASE_TEST_BENCH_URL,
            onBeforeLoad: (win: Window) => {
                const fetchStub = cy.stub(win, 'fetch').as('fetchStub');
                fetchStub
                    .onFirstCall()
                    .resolves({
                        json: () => ({
                            token: 'eyJhbGciOiJFUzI1NiIsImFwcElkIjoiN2JjMjcyOGEtMWZiMC00YTg0LTk4YTgtOWUwYjkyMWExNThlIiwia2lkIjoiMmIwY2VhODktZTc3NS00OTJhLTg4YzItY2RlZWI4NWE1YzVkIiwidHlwIjoiSldUIn0.' +
                                   'eyJhdWQiOiJjcm9jdC5pbyIsImV4cCI6MTU4NTc4MTM5NCwianRpIjoiODIyZjVkYjEtZjQ2ZC00MDFhLTg3YjAtOWVlN2FkYzNlNThjIiwiaWF0IjoxNTg1NjA4NTk0LCJpc3MiOiJjcm9jdC5pbyJ9.',
                        }),
                    });
                fetchStub
                    .onSecondCall()
                    .resolves({
                        status: 204,
                        ok: true,
                    } as Response);
                // @ts-ignore
                cy.stub(win, 'WebSocket', (url) => new WebSocket(url));
            },
            timeout: 5000,
        })
            .wait(1000, {log: false})
            .window()
            .its('playgroundReady')
            .should('be.true');
    }
}

export default new TestBench();
