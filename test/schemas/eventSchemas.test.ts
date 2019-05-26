import {Cart, CartItem, Order, OrderItem, ProductDetails} from '../../src/event';
import {
    cartViewed,
    cartModified,
    checkoutStarted,
    orderPlaced,
    productViewed,
    userSignedUp,
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
            expect((): void => cartModified.validate({})).not.toThrowError(Error);
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

describe('The "userSignedUp payload schema', () => {
    test.each([
        [{
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
        }],
        [{
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            gender: 'female',
        }],
        [{
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            gender: 'neutral',
        }],
        [{
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            firstName: 'John',
            lastName: 'Doe',
            birthDate: '1960-06-22',
            gender: 'male',
            email: 'john@doe.com',
            phone: '+5511987654321',
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
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', firstName: ''},
            'Expected at least 1 character at path \'/firstName\', actual 0.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', firstName: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/firstName\', actual 51.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', lastName: ''},
            'Expected at least 1 character at path \'/lastName\', actual 0.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', lastName: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/lastName\', actual 51.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', birthDate: 'foo'},
            'Invalid date format at path \'/birthDate\'.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', gender: 'foo'},
            'Unexpected value at path \'/gender\', expecting \'male\', \'female\' or \'neutral\', found \'foo\'.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', email: ''},
            'Expected at least 1 character at path \'/email\', actual 0.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', email: 'x'.repeat(255)},
            'Expected at most 254 characters at path \'/email\', actual 255.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', phone: ''},
            'Expected at least 1 character at path \'/phone\', actual 0.',
        ],
        [
            {userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392', phone: 'x'.repeat(31)},
            'Expected at most 30 characters at path \'/phone\', actual 31.',
        ],
    ])('should not allow %s', (value: object, message: string) => {
        function validate(): void {
            userSignedUp.validate(value);
        }

        expect(validate).toThrow(Error);
        expect(validate).toThrow(message);
    });
});
