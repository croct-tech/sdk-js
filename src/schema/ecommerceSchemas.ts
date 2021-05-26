import {ObjectType, StringType, NumberType, ArrayType} from '../validation';

export const productDetails = new ObjectType({
    required: ['productId', 'name', 'displayPrice'],
    properties: {
        productId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        sku: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        name: new StringType({
            minLength: 1,
            maxLength: 200,
        }),
        category: new StringType({
            minLength: 1,
            maxLength: 100,
        }),
        brand: new StringType({
            minLength: 1,
            maxLength: 100,
        }),
        variant: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        displayPrice: new NumberType({
            minimum: 0,
        }),
        originalPrice: new NumberType({
            minimum: 0,
        }),
        url: new StringType({
            format: 'url',
        }),
        imageUrl: new StringType({
            format: 'url',
        }),
    },
});

export const cartItem = new ObjectType({
    required: ['index', 'product', 'quantity', 'total'],
    properties: {
        index: new NumberType({
            minimum: 0,
        }),
        product: productDetails,
        quantity: new NumberType({
            minimum: 1,
        }),
        total: new NumberType({
            minimum: 0,
        }),
        discount: new NumberType({
            minimum: 0,
        }),
        coupon: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
    },
});

export const cart = new ObjectType({
    required: ['currency', 'items', 'total'],
    properties: {
        currency: new StringType({
            maxLength: 10,
            minLength: 1,
        }),
        items: new ArrayType({
            items: cartItem,
        }),
        subtotal: new NumberType({
            minimum: 0,
        }),
        shippingPrice: new NumberType({
            minimum: 0,
        }),
        taxes: new ObjectType({
            additionalProperties: new NumberType(),
            minProperties: 1,
        }),
        costs: new ObjectType({
            additionalProperties: new NumberType(),
            minProperties: 1,
        }),
        discount: new NumberType({
            minimum: 0,
        }),
        total: new NumberType({
            minimum: 0,
        }),
        coupon: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        lastUpdateTime: new NumberType(),
    },
});

export const orderItem = new ObjectType({
    required: ['index', 'product', 'quantity', 'total'],
    properties: {
        index: new NumberType({
            minimum: 0,
        }),
        product: productDetails,
        quantity: new NumberType({
            minimum: 1,
        }),
        total: new NumberType({
            minimum: 0,
        }),
        discount: new NumberType({
            minimum: 0,
        }),
        coupon: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
    },
});

export const order = new ObjectType({
    required: ['orderId', 'currency', 'items', 'total'],
    properties: {
        orderId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        currency: new StringType({
            maxLength: 10,
            minLength: 1,
        }),
        items: new ArrayType({
            items: orderItem,
            minItems: 1,
        }),
        subtotal: new NumberType({
            minimum: 0,
        }),
        shippingPrice: new NumberType({
            minimum: 0,
        }),
        taxes: new ObjectType({
            additionalProperties: new NumberType(),
            minProperties: 1,
        }),
        costs: new ObjectType({
            additionalProperties: new NumberType(),
            minProperties: 1,
        }),
        discount: new NumberType({
            minimum: 0,
        }),
        total: new NumberType({
            minimum: 0,
        }),
        coupon: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        paymentMethod: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        installments: new NumberType({
            minimum: 1,
        }),
        status: new StringType({
            enumeration: ['placed', 'paid', 'complete'],
        }),
    },
});
