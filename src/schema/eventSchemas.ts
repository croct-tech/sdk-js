import ObjectType from '../validation/objectType';
import StringType from '../validation/stringType';
import {cart, order, productDetails} from './ecommerceSchemas';
import {userProfileSchema} from './userSchema';
import NumberType from '../validation/numberType';

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

export const testGroupAssigned = new ObjectType({
    required: ['testId', 'groupId'],
    properties: {
        testId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        groupId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
    },
});

export const personalizationApplied = new ObjectType({
    required: ['personalizationId'],
    properties: {
        personalizationId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        audience: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        testId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        groupId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
    },
});

export const goalCompleted = new ObjectType({
    required: ['goalId'],
    properties: {
        goalId: new StringType({
            minLength: 1,
            maxLength: 50,
        }),
        value: new NumberType({
            minimum: 0,
        }),
    },
});
