import {Cart, CartItem, Order, OrderItem, ProductDetails} from '../../src/trackingEvents';
import {cart, cartItem, order, orderItem, productDetails} from '../../src/schema';
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

describe('The product details schema', () => {
    it.each([
        [minimalProductDetails],
        [{
            productId: '12345',
            sku: 'a9b2745f-9d0b-4bfe-8ebd-7376dd932169',
            name: 'Smartphone 9',
            category: 'Smartphone',
            brand: 'Acme',
            variant: '64GB Green',
            displayPrice: 599.00,
            originalPrice: 699.00,
            url: 'https://www.acme.com/product/smartphone9',
            imageUrl: 'https://www.acme.com/images/smartphone9-64gb-green',
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            productDetails.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {name: 'Smartphone 9', displayPrice: 599.00},
            'Missing property \'/productId\'.',
        ],
        [
            {productId: '12345', displayPrice: 599.00},
            'Missing property \'/name\'.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9'},
            'Missing property \'/displayPrice\'.',
        ],
        [
            {productId: '', name: 'Smartphone 9', displayPrice: 599.00},
            'Expected at least 1 character at path \'/productId\', actual 0.',
        ],
        [
            {productId: 'x'.repeat(51), name: 'Smartphone 9', displayPrice: 599.00},
            'Expected at most 50 characters at path \'/productId\', actual 51.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, sku: ''},
            'Expected at least 1 character at path \'/sku\', actual 0.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, sku: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/sku\', actual 51.',
        ],
        [
            {productId: '12345', name: '', displayPrice: 599.00},
            'Expected at least 1 character at path \'/name\', actual 0.',
        ],
        [
            {productId: '12345', name: 'x'.repeat(201), displayPrice: 599.00},
            'Expected at most 200 characters at path \'/name\', actual 201.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, category: ''},
            'Expected at least 1 character at path \'/category\', actual 0.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, category: 'x'.repeat(101)},
            'Expected at most 100 characters at path \'/category\', actual 101.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, brand: ''},
            'Expected at least 1 character at path \'/brand\', actual 0.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, brand: 'x'.repeat(101)},
            'Expected at most 100 characters at path \'/brand\', actual 101.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, variant: ''},
            'Expected at least 1 character at path \'/variant\', actual 0.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, variant: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/variant\', actual 51.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: -1},
            'Expected a value greater than or equal to 0 at path \'/displayPrice\', actual -1.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, originalPrice: -1},
            'Expected a value greater than or equal to 0 at path \'/originalPrice\', actual -1.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, url: 'foo'},
            'Invalid url format at path \'/url\'.',
        ],
        [
            {productId: '12345', name: 'Smartphone 9', displayPrice: 599.00, imageUrl: 'foo'},
            'Invalid url format at path \'/imageUrl\'.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            productDetails.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The cart item schema', () => {
    it.each([
        [minimalCartItem],
        [{
            index: 0,
            quantity: 1,
            total: 699.00,
            discount: 100.00,
            coupon: 'PROMO',
            product: minimalProductDetails,
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            cartItem.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {
                product: minimalProductDetails,
                total: 699.00,
                quantity: 1,
            },
            'Missing property \'/index\'.',
        ],
        [
            {
                index: 0,
                total: 699.00,
                quantity: 1,
            },
            'Missing property \'/product\'.',
        ],
        [
            {
                index: 0,
                total: 699.00,
                product: minimalProductDetails,
            },
            'Missing property \'/quantity\'.',
        ],
        [
            {
                index: 0,
                quantity: 1,
                product: minimalProductDetails,
            },
            'Missing property \'/total\'.',
        ],
        [
            {
                index: -1,
                total: 699.00,
                quantity: 1,
                product: minimalProductDetails,
            },
            'Expected a value greater than or equal to 0 at path \'/index\', actual -1.',
        ],
        [
            {
                index: 0,
                total: 699.00,
                quantity: 0,
                product: minimalProductDetails,
            },
            'Expected a value greater than or equal to 1 at path \'/quantity\', actual 0.',
        ],
        [
            {
                index: 0,
                total: -1,
                quantity: 1,
                product: minimalProductDetails,
            },
            'Expected a value greater than or equal to 0 at path \'/total\', actual -1.',
        ],
        [
            {
                index: 0,
                total: 0,
                discount: -1,
                quantity: 1,
                product: minimalProductDetails,
            },
            'Expected a value greater than or equal to 0 at path \'/discount\', actual -1.',
        ],
        [
            {
                index: 0,
                total: 0,
                quantity: 1,
                product: minimalProductDetails,
                coupon: '',
            },
            'Expected at least 1 character at path \'/coupon\', actual 0.',
        ],
        [
            {
                index: 0,
                total: 0,
                quantity: 1,
                product: minimalProductDetails,
                coupon: 'x'.repeat(51),
            },
            'Expected at most 50 characters at path \'/coupon\', actual 51.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            cartItem.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The cart schema', () => {
    it.each([
        [minimalCart],
        [{
            currency: 'brl',
            items: [
                {
                    index: 0,
                    quantity: 1,
                    total: 699.00,
                    discount: 100.00,
                    coupon: 'PROMO',
                    product: minimalProductDetails,
                },
                {
                    index: 1,
                    quantity: 1,
                    total: 39.00,
                    discount: 10.00,
                    coupon: 'PROMO',
                    product: minimalProductDetails,
                },
            ],
            taxes: {
                state: 53.51,
                local: 23.98,
            },
            costs: {
                manufacturing: 275.81,
                cos: 85.37,
            },
            subtotal: 848.00,
            shippingPrice: 59.99,
            discount: 169.99,
            total: 815.49,
            coupon: 'FREE-SHIPPING',
            lastUpdateTime: 123456789,
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            cart.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {
                total: 776.49,
                items: [minimalCartItem],
            },
            'Missing property \'/currency\'.',
        ],
        [
            {
                currency: 'brl',
                items: [minimalCartItem],
            },
            'Missing property \'/total\'.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
            },
            'Missing property \'/items\'.',
        ],
        [
            {
                currency: 'abcdefghijk',
                total: 776.49,
                items: [minimalCartItem],
            },
            'Expected at most 10 characters at path \'/currency\', actual 11.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: ['foo'],
            },
            'Expected value of type object at path \'/items/0\', actual string.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                subtotal: -1,
            },
            'Expected a value greater than or equal to 0 at path \'/subtotal\', actual -1.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                shippingPrice: -1,
            },
            'Expected a value greater than or equal to 0 at path \'/shippingPrice\', actual -1.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                taxes: 'foo',
            },
            'Expected value of type object at path \'/taxes\', actual string.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                taxes: {},
            },
            'Expected at least 1 entry at path \'/taxes\', actual 0.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                taxes: {foo: 'bar'},
            },
            'Expected value of type number at path \'/taxes/foo\', actual string.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                costs: 'foo',
            },
            'Expected value of type object at path \'/costs\', actual string.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                costs: {},
            },
            'Expected at least 1 entry at path \'/costs\', actual 0.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                costs: {foo: 'bar'},
            },
            'Expected value of type number at path \'/costs/foo\', actual string.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                discount: -1,
            },
            'Expected a value greater than or equal to 0 at path \'/discount\', actual -1.',
        ],
        [
            {
                currency: 'brl',
                total: -1,
                items: [minimalCartItem],
            },
            'Expected a value greater than or equal to 0 at path \'/total\', actual -1.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                coupon: '',
            },
            'Expected at least 1 character at path \'/coupon\', actual 0.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                coupon: 'x'.repeat(51),
            },
            'Expected at most 50 characters at path \'/coupon\', actual 51.',
        ],
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalCartItem],
                lastUpdateTime: 'foo',
            },
            'Expected value of type number at path \'/lastUpdateTime\', actual string.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            cart.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The order item schema', () => {
    it.each([
        [minimalOrderItem],
        [{
            index: 0,
            quantity: 1,
            total: 699.00,
            discount: 100.00,
            coupon: 'PROMO',
            product: minimalProductDetails,
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            orderItem.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {
                product: minimalProductDetails,
                total: 699.00,
                quantity: 1,
            },
            'Missing property \'/index\'.',
        ],
        [
            {
                index: 0,
                total: 699.00,
                quantity: 1,
            },
            'Missing property \'/product\'.',
        ],
        [
            {
                index: 0,
                total: 699.00,
                product: minimalProductDetails,
            },
            'Missing property \'/quantity\'.',
        ],
        [
            {
                index: 0,
                quantity: 1,
                product: minimalProductDetails,
            },
            'Missing property \'/total\'.',
        ],
        [
            {
                index: -1,
                total: 699.00,
                quantity: 1,
                product: minimalProductDetails,
            },
            'Expected a value greater than or equal to 0 at path \'/index\', actual -1.',
        ],
        [
            {
                index: 0,
                total: 699.00,
                quantity: 0,
                product: minimalProductDetails,
            },
            'Expected a value greater than or equal to 1 at path \'/quantity\', actual 0.',
        ],
        [
            {
                index: 0,
                total: -1,
                quantity: 1,
                product: minimalProductDetails,
            },
            'Expected a value greater than or equal to 0 at path \'/total\', actual -1.',
        ],
        [
            {
                index: 0,
                total: 0,
                discount: -1,
                quantity: 1,
                product: minimalProductDetails,
            },
            'Expected a value greater than or equal to 0 at path \'/discount\', actual -1.',
        ],
        [
            {
                index: 0,
                total: 0,
                quantity: 1,
                product: minimalProductDetails,
                coupon: '',
            },
            'Expected at least 1 character at path \'/coupon\', actual 0.',
        ],
        [
            {
                index: 0,
                total: 0,
                quantity: 1,
                product: minimalProductDetails,
                coupon: 'x'.repeat(51),
            },
            'Expected at most 50 characters at path \'/coupon\', actual 51.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            orderItem.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The order schema', () => {
    it.each([
        [minimalOrder],
        [{
            orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
            currency: 'brl',
            items: [
                {
                    index: 0,
                    quantity: 1,
                    total: 699.00,
                    discount: 100.00,
                    coupon: 'PROMO',
                    product: {
                        productId: '12345',
                        sku: 'a9b2745f-9d0b-4bfe-8ebd-7376dd932169',
                        name: 'Smartphone 9',
                        category: 'Smartphone',
                        brand: 'Acme',
                        variant: '64GB Green',
                        displayPrice: 699.00,
                        originalPrice: 799.00,
                        url: 'https://www.acme.com/product/smartphone9',
                        imageUrl: 'https://www.acme.com/images/smartphone9-64gb-green',
                    },
                },
                {
                    index: 1,
                    quantity: 1,
                    total: 39.00,
                    discount: 10.00,
                    coupon: 'PROMO',
                    product: {
                        productId: '98765',
                        sku: '03132db8-2c37-4aef-9827-60d0206683d9',
                        name: 'Silicone Case',
                        category: 'Cases',
                        brand: 'Acme',
                        variant: 'Black',
                        displayPrice: 39.00,
                        originalPrice: 49.00,
                        url: 'https://www.acme.com/product/silicone-case',
                        imageUrl: 'https://www.acme.com/images/silicone-case-black',
                    },
                },
            ],
            taxes: {
                state: 53.51,
                local: 23.98,
            },
            costs: {
                manufacturing: 275.81,
                cos: 85.37,
            },
            subtotal: 848.00,
            shippingPrice: 59.99,
            discount: 169.99,
            total: 815.49,
            coupon: 'FREE-SHIPPING',
            paymentMethod: 'credit-card',
            installments: 1,
            status: 'paid',
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            order.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
            },
            'Missing property \'/orderId\'.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                total: 776.49,
                items: [minimalOrderItem],
            },
            'Missing property \'/currency\'.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                items: [minimalOrderItem],
            },
            'Missing property \'/total\'.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
            },
            'Missing property \'/items\'.',
        ],
        [
            {
                orderId: '',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
            },
            'Expected at least 1 character at path \'/orderId\', actual 0.',
        ],
        [
            {
                orderId: 'x'.repeat(51),
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
            },
            'Expected at most 50 characters at path \'/orderId\', actual 51.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: '',
                total: 776.49,
                items: [minimalOrderItem],
            },
            'Expected at least 1 character at path \'/currency\', actual 0.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'abcdefghijk',
                total: 776.49,
                items: [minimalOrderItem],
            },
            'Expected at most 10 characters at path \'/currency\', actual 11.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [],
            },
            'Expected at least 1 item at path \'/items\', actual 0.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: ['foo'],
            },
            'Expected value of type object at path \'/items/0\', actual string.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                shippingPrice: -1,
            },
            'Expected a value greater than or equal to 0 at path \'/shippingPrice\', actual -1.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                subtotal: -1,
            },
            'Expected a value greater than or equal to 0 at path \'/subtotal\', actual -1.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                taxes: 'foo',
            },
            'Expected value of type object at path \'/taxes\', actual string.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                taxes: {},
            },
            'Expected at least 1 entry at path \'/taxes\', actual 0.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                taxes: {foo: 'bar'},
            },
            'Expected value of type number at path \'/taxes/foo\', actual string.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                costs: 'foo',
            },
            'Expected value of type object at path \'/costs\', actual string.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                costs: {},
            },
            'Expected at least 1 entry at path \'/costs\', actual 0.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                costs: {foo: 'bar'},
            },
            'Expected value of type number at path \'/costs/foo\', actual string.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                discount: -1,
            },
            'Expected a value greater than or equal to 0 at path \'/discount\', actual -1.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: -1,
                items: [minimalOrderItem],
            },
            'Expected a value greater than or equal to 0 at path \'/total\', actual -1.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                coupon: '',
            },
            'Expected at least 1 character at path \'/coupon\', actual 0.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                coupon: 'x'.repeat(51),
            },
            'Expected at most 50 characters at path \'/coupon\', actual 51.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                paymentMethod: '',
            },
            'Expected at least 1 character at path \'/paymentMethod\', actual 0.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                paymentMethod: 'x'.repeat(51),
            },
            'Expected at most 50 characters at path \'/paymentMethod\', actual 51.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                installments: 0,
            },
            'Expected a value greater than or equal to 1 at path \'/installments\', actual 0.',
        ],
        [
            {
                orderId: 'b76c0ef6-9520-4107-9de3-11110829588e',
                currency: 'brl',
                total: 776.49,
                items: [minimalOrderItem],
                status: 'foo',
            },
            'Unexpected value at path \'/status\', expecting \'placed\', \'paid\' or \'complete\', found \'foo\'.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            order.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
