import ObjectType from '../validation/objectType';
import StringType from '../validation/stringType';
import {cart, order, productDetails} from './ecommerceSchemas';
import {userProfileSchema} from './userSchema';

export const cartModified = new ObjectType({
    required: ['cart'],
    properties: {
        cart: cart,
    },
});

export const cartViewed = new ObjectType({
    required: ['cart'],
    properties: {
        cart: cart,
    },
});

export const checkoutStarted = new ObjectType({
    required: ['cart'],
    properties: {
        cart: cart,
        orderId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
    },
});

export const orderPlaced = new ObjectType({
    required: ['order'],
    properties: {
        order: order,
    },
});

export const productViewed = new ObjectType({
    required: ['product'],
    properties: {
        product: productDetails,
    },
});

export const userSignedUp = new ObjectType({
    required: ['userId'],
    properties: {
        userId: new StringType({
            minLength: 1,
            maxLength: 254,
        }),
        profile: userProfileSchema,
    },
});
