import {Patch} from './patch';

export type CustomPayloadType =
    'productViewed' |
    'cartModified' |
    'cartViewed' |
    'checkoutStarted' |
    'orderPlaced' |
    'userSignedUp'
;

export type PayloadType =
    CustomPayloadType |
    'pageLoaded' |
    'pageOpened' |
    'tabOpened' |
    'urlChanged' |
    'nothingChanged' |
    'pageVisibilityChanged' |
    'userSignedIn' |
    'userSignedOut' |
    'userProfileChanged' |
    'sessionAttributesChanged'
;

type BasePayload<T extends PayloadType> = {
    type: T
}

export type TabOpened = BasePayload<'tabOpened'>;

export type PageLoaded = BasePayload<'pageLoaded'> & {
    title: string
    lastModified: number
}

export type PageOpened = BasePayload<'pageOpened'> & {
    referrer: string
}

export type PageVisibilityChanged = BasePayload<'pageVisibilityChanged'> & {
    visibility: 'visible' | 'hidden'
}

export type UrlChanged = BasePayload<'urlChanged'>;

export type NothingChanged = BasePayload<'nothingChanged'>;

export type UserProfileChanged = BasePayload<'userProfileChanged'> & {
    patch: Patch
}

export type SessionAttributesChanged = BasePayload<'sessionAttributesChanged'> & {
    patch: Patch
}

export type UserSignedIn = BasePayload<'userSignedIn'>;
export type UserSignedOut = BasePayload<'userSignedOut'>;

export type PartialPayload =
    PageOpened |
    PageLoaded |
    NothingChanged |
    PageVisibilityChanged |
    TabOpened |
    UrlChanged |
    UserProfileChanged |
    UserSignedIn |
    UserSignedOut |
    SessionAttributesChanged
;

export type Payload = PartialPayload & {
    tabId: string
    url: string
};

export type UserToken = {
    readonly value: string;
    readonly timestamp: number;
}

export type Beacon = {
    userToken: UserToken | null
    timestamp: number
    payload: Payload
    version: string
}

export type ProductDetails = {
    productId: string
    productSku: string | null
    name: string
    category: string | null
    brand: string | null
    variant: string | null
    displayPrice: number
    originalPrice: number | null
    url: string | null
    imageUrl: string | null
}

export type CartItem = {
    index: number | null
    productDetails: ProductDetails
    quantity: number | null
    total: number
    discount: number | null
    coupon: string | null
}

export type Cart = {
    cartId: string | null
    currency: string
    items: CartItem[]
    subtotal: number | null
    shippingPrice: number | null
    taxes: { [key: string]: number | null }
    costs: { [key: string]: number | null }
    discount: number | null
    total: number
    coupon: string | null
    lastUpdateTime: number
}

export type OrderItem = {
    index: number | null
    productDetails: ProductDetails
    quantity: number | null
    total: number
    discount: number | null
    coupon: string | null
}

export type Order = {
    cartId: string | null
    orderId: string
    currency: string
    items: OrderItem[]
    subtotal: number | null
    shippingPrice: number | null
    taxes: { [key: string]: number | null }
    costs: { [key: string]: number | null }
    discount: number | null
    total: number
    coupon: string | null
    paymentMethod: string | null
    installments: number | null
    status: 'placed' | 'paid' | 'completed'
}

export type ProductViewed = Payload & {
    productDetails: ProductDetails
}

export type CartModified = {
    cart: Cart
}

export type CartViewed = {
    cart: Cart
}

export type CheckoutStarted = {
    cart: Cart
    orderId: string | null
}

export type OrderPlaced = {
    order: Order
}

export type UserSignedUp = {
    token: string
    firstName: string | null
    lastName: string | null
    birthDate: string | null
    gender: 'male' | 'female' | 'neutral' | null
    email: string | null
    phone: string | null
}