import {uuid4} from '../src/uuid';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('A UUID v4 function', () => {
    test('should generate a random UUID', () => {
        const generated = [];

        for (let iteration = 0; iteration < 100; iteration++) {
            const uuid = uuid4();

            expect(uuid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
            expect(generated).not.toContainEqual(uuid);

            generated.push(uuid);
        }
    });

    test('should generate a random and lexicographically sortable UUID', async () => {
        let timestamp: number = Date.now();
        jest.spyOn(Date, 'now').mockImplementation(() => {
            timestamp += 1;

            return timestamp;
        });

        const generated = [];
        for (let iteration = 0; iteration < 100; iteration++) {
            const uuid = uuid4(true);

            expect(uuid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
            expect(generated).not.toContainEqual(uuid);

            generated.push(uuid);
        }

        expect([...generated]).toEqual(generated.sort());
    });
});
