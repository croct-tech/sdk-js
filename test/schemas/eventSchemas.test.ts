import {Cart, CartItem, Order, OrderItem, ProductDetails} from '../../src/event';
import {
    cartViewed,
    cartModified,
    checkoutStarted,
    orderPlaced,
    productViewed,
    userSignedUp,
    testGroupAssigned,
    eventOccurred,
    goalAchieved,
} from '../../src/schema/eventSchemas';
import {Optional} from '../../src/utilityTypes';

const minimalProductDetails: ProductDetails = {
    productId: '12345',
    name: 'Smartphone 9',
    displayPrice: 599.00,
};
const minimalCartItem: CartItem = {
    index: 0,
    total: 699.00,
    quantity: 1,
    product: minimalProductDetails,
};
const minimalCart: Optional<Cart, 'lastUpdateTime'> = {
    currency: 'brl',
    total: 776.49,
    items: [minimalCartItem],
};
const minimalOrderItem: OrderItem = {
    index: 0,
    total: 699.00,
    quantity: 1,
    product: minimalProductDetails,
};
const minimalOrder: Order = {
    orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
    currency: 'brl',
    total: 776.49,
    items: [minimalOrderItem],
};

describe('The "cartModified" payload schema', () => {
    test('should allow %s', () => {
        function validate(): void {
            cartModified.validate({cart: minimalCart});
        }

        expect(validate).not.toThrow(Error);
    });

    test('should not allow %s', () => {
        function validate(): void {
            expect((): void => cartModified.validate({})).not.toThrow(Error);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Missing property \'/cart\'.');
    });
});

describe('The "cartViewed" payload schema', () => {
    test('should allow %s', () => {
        function validate(): void {
            cartViewed.validate({cart: minimalCart});
        }

        expect(validate).not.toThrow(Error);
    });

    test('should not allow %s', () => {
        function validate(): void {
            cartViewed.validate({});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Missing property \'/cart\'.');
    });
});

describe('The "checkoutStarted" payload schema', () => {
    test.each([
        [{cart: minimalCart}],
        [{cart: minimalCart, orderId: 'b76c0ef6-9520-4107-9de3-11110829588e'}],
    ])('should allow %s', (value: object) => {
        function validate(): void {
            checkoutStarted.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [
            {orderId: 'b76c0ef6-9520-4107-9de3-11110829588e'},
            'Missing property \'/cart\'.',
        ],
        [
            {cart: minimalCart, orderId: ''},
            'Expected at least 1 character at path \'/orderId\', actual 0.',
        ],
        [
            {cart: minimalCart, orderId: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/orderId\', actual 51.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            checkoutStarted.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});

describe('The "orderPlaced" payload schema', () => {
    test('should allow %s', () => {
        function validate(): void {
            orderPlaced.validate({order: minimalOrder});
        }

        expect(validate).not.toThrow(Error);
    });

    test('should not allow %s', () => {
        function validate(): void {
            orderPlaced.validate({});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Missing property \'/order\'.');
    });
});

describe('The "productViewed" payload schema', () => {
    test('should allow %s', () => {
        function validate(): void {
            productViewed.validate({product: minimalProductDetails});
        }

        expect(validate).not.toThrow(Error);
    });

    test('should not allow %s', () => {
        function validate(): void {
            productViewed.validate({});
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow('Missing property \'/product\'.');
    });
});

describe('The "userSignedUp" payload schema', () => {
    test.each([
        [{
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
        }],
        [{
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            profile: {firstName: 'John'},
        }],
    ])('should allow %s', (value: object) => {
        function validate(): void {
            userSignedUp.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [
            {},
            'Missing property \'/userId\'.',
        ],
        [
            {userId: ''},
            'Expected at least 1 character at path \'/userId\', actual 0.',
        ],
        [
            {userId: 'x'.repeat(255)},
            'Expected at most 254 characters at path \'/userId\', actual 255.',
        ],
        [
            {userId: 'username', profile: null},
            'Expected value of type object at path \'/profile\', actual null.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            userSignedUp.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});

describe('The "testGroupAssigned" payload schema', () => {
    test('should allow %s', () => {
        const value = {
            testId: 'foo',
            groupId: 'bar',
        };

        function validate(): void {
            testGroupAssigned.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [
            {},
            'Missing property \'/testId\'.',
        ],
        [
            {groupId: 'bar'},
            'Missing property \'/testId\'.',
        ],
        [
            {testId: 'foo'},
            'Missing property \'/groupId\'.',
        ],
        [
            {testId: '', groupId: 'bar'},
            'Expected at least 1 character at path \'/testId\', actual 0.',
        ],
        [
            {testId: 'foo', groupId: ''},
            'Expected at least 1 character at path \'/groupId\', actual 0.',
        ],
        [
            {testId: 'x'.repeat(51), groupId: 'bar'},
            'Expected at most 50 characters at path \'/testId\', actual 51.',
        ],
        [
            {testId: 'foo', groupId: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/groupId\', actual 51.',
        ],
        [
            {testId: null, groupId: 'bar'},
            'Expected value of type string at path \'/testId\', actual null.',
        ],
        [
            {testId: 'foo', groupId: null},
            'Expected value of type string at path \'/groupId\', actual null.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            testGroupAssigned.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});

describe('The "eventOccurred" payload schema', () => {
    test.each([
        [{
            name: 'foo',
        }],
        [{
            name: 'event-name',
            personalizationId: 'foo',
            audience: 'bar',
            testId: 'baz',
            groupId: 'barbaz',
            details: {
                number: 10,
                null: null,
                string: 'string',
                boolean: true,
            },
        }],
    ])('should allow %s', (value: object) => {
        function validate(): void {
            eventOccurred.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [
            {},
            'Missing property \'/name\'.',
        ],
        [
            {name: ''},
            'Expected at least 1 character at path \'/name\', actual 0.',
        ],
        [
            {name: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/name\', actual 51.',
        ],
        [
            {name: null},
            'Expected value of type string at path \'/name\', actual null.',
        ],
        [
            {name: 'foo', personalizationId: ''},
            'Expected at least 1 character at path \'/personalizationId\', actual 0.',
        ],
        [
            {name: 'foo', personalizationId: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/personalizationId\', actual 51.',
        ],
        [
            {name: 'foo', personalizationId: null},
            'Expected value of type string at path \'/personalizationId\', actual null.',
        ],
        [
            {name: 'foo', audience: ''},
            'Expected at least 1 character at path \'/audience\', actual 0.',
        ],
        [
            {name: 'foo', audience: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/audience\', actual 51.',
        ],
        [
            {name: 'foo', audience: null},
            'Expected value of type string at path \'/audience\', actual null.',
        ],
        [
            {name: 'foo', testId: ''},
            'Expected at least 1 character at path \'/testId\', actual 0.',
        ],
        [
            {name: 'foo', testId: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/testId\', actual 51.',
        ],
        [
            {name: 'foo', testId: null},
            'Expected value of type string at path \'/testId\', actual null.',
        ],
        [
            {name: 'foo', groupId: ''},
            'Expected at least 1 character at path \'/groupId\', actual 0.',
        ],
        [
            {name: 'foo', groupId: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/groupId\', actual 51.',
        ],
        [
            {name: 'foo', groupId: null},
            'Expected value of type string at path \'/groupId\', actual null.',
        ],
        [
            {name: 'foo', details: null},
            'Expected value of type object at path \'/details\', actual null.',
        ],
        [
            {name: 'foo', details: {'@bar': 1}},
            'Invalid identifier format at path \'/details/@bar\'.',
        ],
        [
            {name: 'foo', details: {looooooooooooooongKey: 'baz'}},
            'Expected at most 20 characters at path \'/details/looooooooooooooongKey\', actual 21.',
        ],
        [
            {name: 'foo', details: {longString: 'x'.repeat(301)}},
            'Expected at most 300 characters at path \'/details/longString\', actual 301.',
        ],
        [
            {name: 'foo', details: {bar: []}},
            'Expected value of type null, boolean, number or string at path \'/details/bar\', actual array.',
        ],
        [
            {name: 'foo', details: {bar: {}}},
            'Expected value of type null, boolean, number or string at path \'/details/bar\', actual Object.',
        ],
        [
            {
                name: 'foo',
                details: {
                    a: 1,
                    b: 2,
                    c: 3,
                    d: 4,
                    e: 5,
                    f: 6,
                    g: 7,
                    h: 8,
                    i: 9,
                    j: 10,
                    k: 11,
                },
            },
            'Expected at most 10 entries at path \'/details\', actual 11.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            eventOccurred.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});

describe('The "goalAchieved" payload schema', () => {
    test.each([
        [{
            goalId: 'foo',
        }],
        [{
            goalId: 'foo',
            value: 1,
            currency: 'brl',
        }],
    ])('should allow %s', (value: object) => {
        function validate(): void {
            goalAchieved.validate(value);
        }

        expect(validate).not.toThrow(Error);
    });

    test.each([
        [
            {},
            'Missing property \'/goalId\'.',
        ],
        [
            {goalId: ''},
            'Expected at least 1 character at path \'/goalId\', actual 0.',
        ],
        [
            {goalId: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/goalId\', actual 51.',
        ],
        [
            {goalId: null},
            'Expected value of type string at path \'/goalId\', actual null.',
        ],
        [
            {goalId: 'foo', value: -1},
            'Expected a value greater than or equal to 0 at path \'/value\', actual -1.',
        ],
        [
            {goalId: 'foo', value: null},
            'Expected value of type number at path \'/value\', actual null.',
        ],
        [
            {goalId: 'foo', currency: ''},
            'Expected at least 1 character at path \'/currency\', actual 0.',
        ],
        [
            {goalId: 'foo', currency: 'x'.repeat(11)},
            'Expected at most 10 characters at path \'/currency\', actual 11.',
        ],
        [
            {goalId: 'foo', currency: null},
            'Expected value of type string at path \'/currency\', actual null.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            goalAchieved.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
