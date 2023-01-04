import {ArrayType, StringType, ObjectType, NumberType} from '../validation';

export const postDetails = new ObjectType({
    required: ['postId', 'title', 'publishTime'],
    properties: {
        postId: new StringType({
            minLength: 1,
            maxLength: 200,
        }),
        url: new StringType({
            format: 'url',
        }),
        title: new StringType({
            minLength: 1,
            maxLength: 200,
        }),
        tags: new ArrayType({
            items: new StringType({
                minLength: 1,
                maxLength: 50,
            }),
            minItems: 1,
            maxItems: 10,
        }),
        categories: new ArrayType({
            items: new StringType({
                minLength: 1,
                maxLength: 50,
            }),
            minItems: 1,
            maxItems: 10,
        }),
        authors: new ArrayType({
            items: new StringType({
                minLength: 1,
                maxLength: 50,
            }),
            minItems: 1,
            maxItems: 10,
        }),
        publishTime: new NumberType(),
        updateTime: new NumberType(),
    },
});
