import {
    Cart,
    CartItem,
    ExternalTrackingEvent,
    GoalCompleted,
    InterestShown,
    LinkOpened,
    Order,
    OrderItem,
    PostViewed,
    ProductDetails,
    EventOccurred,
} from '../../src/trackingEvents';
import {
    cartViewed,
    cartModified,
    checkoutStarted,
    orderPlaced,
    productViewed,
    userSignedUp,
    eventOccurred,
    goalCompleted,
    interestShown,
    postViewed,
    linkOpened,
} from '../../src/schema';
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
    it('should allow %s', () => {
        function validate(): void {
            cartModified.validate({cart: minimalCart});
        }

        expect(validate).not.toThrow();
    });

    it('should not allow %s', () => {
        function validate(): void {
            cartModified.validate({});
        }

        expect(validate).toThrowWithMessage(Error, 'Missing property \'/cart\'.');
    });
});

describe('The "cartViewed" payload schema', () => {
    it('should allow %s', () => {
        function validate(): void {
            cartViewed.validate({cart: minimalCart});
        }

        expect(validate).not.toThrow();
    });

    it('should not allow %s', () => {
        function validate(): void {
            cartViewed.validate({});
        }

        expect(validate).toThrowWithMessage(Error, 'Missing property \'/cart\'.');
    });
});

describe('The "checkoutStarted" payload schema', () => {
    it.each<Array<Omit<ExternalTrackingEvent<'checkoutStarted'>, 'type'>>>([
        [{cart: minimalCart}],
        [{cart: minimalCart, orderId: 'b76c0ef6-9520-4107-9de3-11110829588e'}],
    ])('should allow %s', value => {
        function validate(): void {
            checkoutStarted.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
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
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            checkoutStarted.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The "orderPlaced" payload schema', () => {
    it('should allow %s', () => {
        function validate(): void {
            orderPlaced.validate({order: minimalOrder});
        }

        expect(validate).not.toThrow();
    });

    it('should not allow %s', () => {
        function validate(): void {
            orderPlaced.validate({});
        }

        expect(validate).toThrowWithMessage(Error, 'Missing property \'/order\'.');
    });
});

describe('The "productViewed" payload schema', () => {
    it('should allow %s', () => {
        function validate(): void {
            productViewed.validate({product: minimalProductDetails});
        }

        expect(validate).not.toThrow();
    });

    it('should not allow %s', () => {
        function validate(): void {
            productViewed.validate({});
        }

        expect(validate).toThrowWithMessage(Error, 'Missing property \'/product\'.');
    });
});

describe('The "userSignedUp" payload schema', () => {
    it.each<Array<Omit<ExternalTrackingEvent<'userSignedUp'>, 'type'>>>([
        [{
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
        }],
        [{
            userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
            profile: {firstName: 'John'},
        }],
    ])('should allow %s', value => {
        function validate(): void {
            userSignedUp.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
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
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            userSignedUp.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The "eventOccurred" payload schema', () => {
    it.each<Array<Omit<EventOccurred, 'type'>>>([
        [{
            name: 'foo',
        }],
        [{
            name: 'event-name',
            label: 'foo',
            action: 'bar',
            category: 'baz',
            details: {
                number: 10,
                null: null,
                string: 'string',
                boolean: true,
            },
        }],
    ])('should allow %s', value => {
        function validate(): void {
            eventOccurred.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
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
            {name: 'foo', label: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/label\', actual 51.',
        ],
        [
            {name: 'foo', label: null},
            'Expected value of type string at path \'/label\', actual null.',
        ],
        [
            {name: 'foo', action: ''},
            'Expected at least 1 character at path \'/action\', actual 0.',
        ],
        [
            {name: 'foo', action: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/action\', actual 51.',
        ],
        [
            {name: 'foo', action: null},
            'Expected value of type string at path \'/action\', actual null.',
        ],
        [
            {name: 'foo', category: ''},
            'Expected at least 1 character at path \'/category\', actual 0.',
        ],
        [
            {name: 'foo', category: 'x'.repeat(51)},
            'Expected at most 50 characters at path \'/category\', actual 51.',
        ],
        [
            {name: 'foo', category: null},
            'Expected value of type string at path \'/category\', actual null.',
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
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            eventOccurred.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The "goalCompleted" payload schema', () => {
    it.each<Array<Omit<GoalCompleted, 'type'>>>([
        [{
            goalId: 'foo:bar-baz_123',
        }],
        [{
            goalId: 'foo::bar',
        }],
        [{
            goalId: 'foo--bar',
        }],
        [{
            goalId: 'foo__bar',
        }],
        [{
            goalId: 'foo-:_bar',
        }],
        [{
            goalId: 'foo',
            value: 1,
            currency: 'brl',
        }],
    ])('should allow %s', value => {
        function validate(): void {
            goalCompleted.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {},
            'Missing property \'/goalId\'.',
        ],
        [
            {goalId: ''},
            'Expected at least 3 characters at path \'/goalId\', actual 0.',
        ],
        [
            {goalId: 'x'.repeat(101)},
            'Expected at most 100 characters at path \'/goalId\', actual 101.',
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
        [
            {goalId: 'díàcrîtĩĉś'},
            'Invalid format at path \'/goalId\'.',
        ],
        [
            {goalId: 'foo*bar'},
            'Invalid format at path \'/goalId\'.',
        ],
        [
            {goalId: ':foo'},
            'Invalid format at path \'/goalId\'.',
        ],
        [
            {goalId: 'foo:'},
            'Invalid format at path \'/goalId\'.',
        ],
        [
            {goalId: '_foo'},
            'Invalid format at path \'/goalId\'.',
        ],
        [
            {goalId: 'foo_'},
            'Invalid format at path \'/goalId\'.',
        ],
        [
            {goalId: '-foo'},
            'Invalid format at path \'/goalId\'.',
        ],
        [
            {goalId: 'foo-'},
            'Invalid format at path \'/goalId\'.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            goalCompleted.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The "interestShown" payload schema', () => {
    it.each<Array<Omit<InterestShown, 'type'>>>([
        [{
            interests: ['foo'],
        }],
        [{
            interests: new Array(10).fill('x'),
        }],
    ])('should allow %s', value => {
        function validate(): void {
            interestShown.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {},
            'Missing property \'/interests\'.',
        ],
        [
            {interests: [null]},
            'Expected value of type string at path \'/interests/0\', actual null.',
        ],
        [
            {interests: ['']},
            'Expected at least 1 character at path \'/interests/0\', actual 0.',
        ],
        [
            {interests: ['x'.repeat(51)]},
            'Expected at most 50 characters at path \'/interests/0\', actual 51.',
        ],
        [
            {interests: new Array(11).fill('x')},
            'Expected at most 10 items at path \'/interests\', actual 11.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            interestShown.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The "postViewed" payload schema', () => {
    it.each<Array<Omit<PostViewed, 'type'>>>([
        [{
            post: {
                postId: 'post-id',
                title: 'post-title',
                publishTime: 0,
            },
        }],
    ])('should allow %s', value => {
        function validate(): void {
            postViewed.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {},
            'Missing property \'/post\'.',
        ],
        [
            {post: null},
            'Expected value of type object at path \'/post\', actual null.',
        ],
    ])('should not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            postViewed.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});

describe('The "linkOpened" payload schema', () => {
    it.each<Array<Omit<LinkOpened, 'type'>>>([
        [{
            link: 'http://www.foo.com.br',
        }],
        [{
            link: '/foo',
        }],
    ])('should allow %s', (value: Record<string, unknown>) => {
        function validate(): void {
            linkOpened.validate(value);
        }

        expect(validate).not.toThrow();
    });

    it.each([
        [
            {},
            'Missing property \'/link\'.',
        ],
        [
            {link: null},
            'Expected value of type string at path \'/link\', actual null.',
        ],
    ])('shout not allow %s', (value: Record<string, unknown>, message: string) => {
        function validate(): void {
            linkOpened.validate(value);
        }

        expect(validate).toThrowWithMessage(Error, message);
    });
});
