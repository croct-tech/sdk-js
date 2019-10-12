import {ArrayType, BooleanType, NumberType, ObjectType, Schema, StringType} from './validation';

export const configurationSchema = new ObjectType({
    required: ['apiKey'],
    properties: {
        apiKey: new StringType({
            format: 'uuid'
        }),
        storageNamespace: new StringType({
            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/
        }),
        tokenScope: new StringType({
            enumeration: [
                'global',
                'contextual',
                'isolated'
            ]
        }),
        debug: new BooleanType(),
        track: new BooleanType(),
    }
});

export const productDetailsSchema = new ObjectType({
    required: ['name', 'displayPrice'],
    properties: {
        productId: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        productSku: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        name: new StringType({
            minLength: 1,
            maxLength: 200
        }),
        category: new StringType({
            minLength: 1,
            maxLength: 100
        }),
        brand: new StringType({
            minLength: 1,
            maxLength: 100
        }),
        variant: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        displayPrice: new NumberType({
            minimum: 0
        }),
        originalPrice: new NumberType({
            minimum: 0
        }),
        url: new StringType({
            format: 'url'
        }),
        imageUrl: new StringType({
            format: 'url'
        }),
    }
});

export const cartItemSchema = new ObjectType({
    required: ['product', 'quantity', 'total'],
    properties: {
        index: new NumberType({
            minimum: 0
        }),
        product: productDetailsSchema,
        quantity: new NumberType({
            minimum: 1
        }),
        total: new NumberType({
            minimum: 0
        }),
        discount: new NumberType({
            minimum: 0
        }),
        coupon: new StringType({
            minLength: 1,
            maxLength: 50
        }),
    }
});

export const cartSchema = new ObjectType({
    required: ['currency', 'items', 'total', 'lastUpdateTime'],
    properties: {
        cartId: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        currency: new StringType({
            format: 'currency'
        }),
        items: new ArrayType({
            items: cartItemSchema,
            minItems: 1
        }),
        subtotal: new NumberType({
            minimum: 0
        }),
        shippingPrice: new NumberType({
            minimum: 0
        }),
        taxes: new ObjectType({
            additionalProperties: new NumberType({}),
            minProperties: 1
        }),
        costs: new ObjectType({
            additionalProperties: new NumberType({}),
            minProperties: 1
        }),
        discount: new NumberType({
            minimum: 0
        }),
        total: new NumberType({
            minimum: 0
        }),
        coupon: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        lastUpdateTime: new NumberType({})
    }
});

export const orderItemSchema = new ObjectType({
    required: ['product', 'quantity', 'total'],
    properties: {
        index: new NumberType({
            minimum: 0
        }),
        product: productDetailsSchema,
        quantity: new NumberType({
            minimum: 1
        }),
        total: new NumberType({
            minimum: 0
        }),
        discount: new NumberType({
            minimum: 0
        }),
        coupon: new StringType({
            minLength: 1,
            maxLength: 50
        }),
    }
});

export const orderSchema = new ObjectType({
    required: ['orderId', 'currency', 'items', 'total'],
    properties: {
        cartId: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        orderId: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        currency: new StringType({
            format: 'currency'
        }),
        items: new ArrayType({
            items: orderItemSchema,
            minItems: 1
        }),
        subtotal: new NumberType({
            minimum: 0
        }),
        shippingPrice: new NumberType({
            minimum: 0
        }),
        taxes: new ObjectType({
            additionalProperties: new NumberType({}),
            minProperties: 1
        }),
        costs: new ObjectType({
            additionalProperties: new NumberType({}),
            minProperties: 1
        }),
        discount: new NumberType({
            minimum: 0
        }),
        total: new NumberType({
            minimum: 0
        }),
        coupon: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        paymentMethod: new StringType({
            minLength: 1,
            maxLength: 50
        }),
        installments: new NumberType({
            minimum: 1
        }),
        status: new StringType({
            enumeration: [
                'placed',
                'paid',
                'complete'
            ]
        })
    }
});

export const cartModifiedPayloadSchema = new ObjectType({
    required: ['cart'],
    properties: {
        cart: cartSchema
    }
});

export const cartViewedPayloadSchema = new ObjectType({
    required: ['cart'],
    properties: {
        cart: cartSchema
    }
});

export const checkoutStartedPayloadSchema = new ObjectType({
    required: ['cart'],
    properties: {
        cart: cartSchema,
        orderId: new StringType({
            minLength: 1,
            maxLength: 50
        }),
    }
});

export const orderPlacedPayloadSchema = new ObjectType({
    required: ['order'],
    properties: {
        order: orderSchema
    }
});

export const productViewedPayloadSchema = new ObjectType({
    required: ['productDetails'],
    properties: {
        productDetails: productDetailsSchema
    }
});

export const userSignedUpPayloadSchema = new ObjectType({
    required: ['token'],
    properties: {
        token: new StringType({
            minLength: 1,
            maxLength: 100
        }),
        firstName: new StringType({
            minLength: 1,
            maxLength: 100
        }),
        lastName: new StringType({
            minLength: 1,
            maxLength: 100
        }),
        birthDate: new StringType({
            format: 'date'
        }),
        gender: new StringType({
            enumeration: [
                'male',
                'female',
                'neutral'
            ]
        }),
        email: new StringType({
            minLength: 1,
            maxLength: 100
        }),
        phone: new StringType({
            minLength: 1,
            maxLength: 50
        }),
    }
});

export const payloadSchemas: {[key: string]: Schema} = {
    userSignedUp: userSignedUpPayloadSchema,
    productViewed: productViewedPayloadSchema,
    cartViewed: cartViewedPayloadSchema,
    cartModified: cartModifiedPayloadSchema,
    checkoutStarted: checkoutStartedPayloadSchema,
    orderPlaced: orderPlacedPayloadSchema,
};
