import {Patch} from './patch';
import {DistributiveOmit, Optional} from './utilityTypes';

/*
 * Object values
 */

export type ProductDetails = {
    productId: string,
    productSku?: string,
    name: string,
    category?: string,
    brand?: string,
    variant?: string,
    displayPrice: number,
    originalPrice?: number,
    url?: string,
    imageUrl?: string,
}

export type CartItem = {
    index: number,
    product: ProductDetails,
    quantity: number,
    total: number,
    discount?: number,
    coupon?: string,
}

export type Cart = {
    cartId?: string,
    currency: string,
    items: CartItem[],
    subtotal?: number,
    shippingPrice?: number,
    taxes?: {[key: string]: number},
    costs?: {[key: string]: number},
    discount?: number,
    total: number,
    coupon?: string,
    lastUpdateTime: number,
}

export type OrderItem = {
    index: number,
    product: ProductDetails,
    quantity?: number,
    total: number,
    discount?: number,
    coupon?: string,
}

export type OrderStatus = 'placed' | 'paid' | 'completed';

export type Order = {
    cartId?: string,
    orderId: string,
    currency: string,
    items: OrderItem[],
    subtotal?: number,
    shippingPrice?: number,
    taxes?: {[key: string]: number},
    costs?: {[key: string]: number},
    discount?: number,
    total: number,
    coupon?: string,
    paymentMethod?: string,
    installments?: number,
    status?: OrderStatus,
};

export type Gender = 'male' | 'female' | 'neutral' | 'unknown';

/*
 * Events
 */

export const pageEventTypes = [
    'pageLoaded',
    'pageOpened',
] as const;

export const tabEventTypes = [
    'tabOpened',
    'tabUrlChanged',
    'tabVisibilityChanged',
] as const;

export const cartEventTypes = [
    'cartModified',
    'cartViewed',
    'checkoutStarted',
] as const;

export const ecommerceEventTypes = [
    ...cartEventTypes,
    'orderPlaced',
    'productViewed',
] as const;

export const identifiedUserEventTypes = [
    'userSignedIn',
    'userSignedOut',
    'userSignedUp',
];

export const userEventTypes = [
    ...identifiedUserEventTypes,
    'userProfileChanged',
] as const;

export const miscEventTypes = [
    'nothingChanged',
    'sessionAttributesChanged',
] as const;

export const eventTypes = [
    ...pageEventTypes,
    ...ecommerceEventTypes,
    ...userEventTypes,
    ...miscEventTypes,
] as const;

export type EventType = typeof eventTypes[number];

interface AbstractEvent {
    type: EventType;
}

/*
 * User events
 */

export interface UserProfileChanged extends AbstractEvent {
    type: 'userProfileChanged';
    patch: Patch;
}

type Primitive = null | string | number | boolean;
type PrimitiveMap = {[member: string]: Primitive};
type PrimitiveArray = Primitive[];

type UserProfile = {
    firstName?: string,
    lastName?: string,
    birthDate?: string,
    gender?: Gender,
    email?: string,
    alternateEmail?: string,
    phone?: string,
    alternatePhone?: string,
    address?: {
        street?: string,
        district?: string,
        city?: string,
        region?: string,
        country?: string,
        postalCode?: string,
    },
    avatar?: string,
    company?: string,
    companyUrl?: string,
    jobTitle?: string,
    custom?: {
        [member: string]: Primitive | PrimitiveMap | PrimitiveArray,
    },
}

export interface UserSignedUp extends AbstractEvent {
    type: 'userSignedUp';
    userId: string;
    profile?: UserProfile;
}

export interface UserSignedIn extends AbstractEvent {
    type: 'userSignedIn';
    userId: string;
}

export interface UserSignedOut extends AbstractEvent {
    type: 'userSignedOut';
    userId: string;
}

export type IdentifiedUserEvent = UserSignedIn | UserSignedOut | UserSignedUp;
export type UserEvent = UserProfileChanged | IdentifiedUserEvent;

/*
 * E-commerce events
 */

export type CartEventType = typeof cartEventTypes[number];

interface BaseCartEvent extends AbstractEvent {
    type: CartEventType;
    cart: Cart;
}

export interface CartViewed extends BaseCartEvent {
    type: 'cartViewed';
}

export interface CartModified extends BaseCartEvent {
    type: 'cartModified';
}

export interface CheckoutStarted extends BaseCartEvent {
    type: 'checkoutStarted';
    orderId?: string;
}

export type CartEvent = CartModified | CartViewed | CheckoutStarted;

export interface OrderPlaced extends AbstractEvent {
    type: 'orderPlaced';
    order: Order;
}

export interface ProductViewed extends AbstractEvent {
    type: 'productViewed';
    product: ProductDetails;
}

export type EcommerceEvent = OrderPlaced | ProductViewed | CartEvent;

/**
 * Tab event
 */

export type TabEventType = typeof tabEventTypes[number];

interface BaseTabEvent extends AbstractEvent {
    type: TabEventType;
    tabId: string;
}

export interface TabOpened extends BaseTabEvent {
    type: 'tabOpened';
}

export interface TabUrlChanged extends BaseTabEvent {
    type: 'tabUrlChanged';
    url: string;
}

export interface TabVisibilityChanged extends BaseTabEvent {
    type: 'tabVisibilityChanged';
    visibility: 'visible' | 'hidden';
}

export type TabEvent = TabVisibilityChanged | TabUrlChanged | TabOpened;

/*
 * Page events
 */

export type PageEventType = typeof pageEventTypes[number];

interface BasePageEvent extends AbstractEvent {
    type: PageEventType;
    url: string;
}

export interface PageOpened extends BasePageEvent {
    type: 'pageOpened';
    referrer?: string;
}

export interface PageLoaded extends BasePageEvent {
    type: 'pageLoaded';
    title: string;
    lastModifiedTime: number;
}

export type PageEvent = PageLoaded | PageOpened;

/*
 * Misc events
 */

export interface NothingChanged extends AbstractEvent {
    type: 'nothingChanged';
    sinceTime: number;
}

export interface SessionAttributesChanged extends AbstractEvent {
    type: 'sessionAttributesChanged';
    patch: Patch;
}

export type MiscEvent = NothingChanged | SessionAttributesChanged;

export type Event = TabEvent | PageEvent | UserEvent | EcommerceEvent | MiscEvent;

/**
 * Partial Events
 */

type CartPartialEvent <T extends CartEvent = CartEvent> =
    DistributiveOmit<T, 'cart'> & Record<'cart', Optional<Cart, 'lastUpdateTime'>>;

export type PartialEvent = Exclude<Event, PageEvent | TabEvent | CartEvent> | CartPartialEvent;

/**
 * External Events
 */

type ExternalEventMap = {
    cartModified: CartPartialEvent<CartModified>,
    cartViewed: CartPartialEvent<CartViewed>,
    checkoutStarted: CartPartialEvent<CheckoutStarted>,
    orderPlaced: OrderPlaced,
    productViewed: ProductViewed,
    userSignedUp: UserSignedUp,
};

export type ExternalEventType = keyof ExternalEventMap;

export type ExternalEvent<T extends ExternalEventType = ExternalEventType> =
    T extends ExternalEventType
        ? ExternalEventMap[T]
        : ExternalEventMap[ExternalEventType]

export type ExternalEventPayload<T extends ExternalEventType> = Omit<ExternalEventMap[T], 'type'>;

/*
 * Type guards
 */

export function isIdentifiedUserEvent(event: Event): event is IdentifiedUserEvent {
    return identifiedUserEventTypes.includes((event as IdentifiedUserEvent).type);
}

export function isCartPartialEvent(event: PartialEvent): event is CartPartialEvent {
    return cartEventTypes.includes((event as CartEvent).type);
}

/*
 * Beacon
 */

export type EventContext = {
    tabId: string,
    url: string,
    metadata?: {[key: string]: string},
};

export type BeaconPayload =
      Exclude<Event, IdentifiedUserEvent>
    // Renames "userId" to "externalUserId"
    | DistributiveOmit<Exclude<IdentifiedUserEvent, UserSignedUp>, 'userId'>
        & Record<'externalUserId', IdentifiedUserEvent['userId']>
    // Renames "userId" to "externalUserId", remove "profile" and add "patch"
    | Omit<UserSignedUp, 'userId' | 'profile'>
        & Record<'externalUserId', IdentifiedUserEvent['userId']>
        & {patch?: Patch}

export type Beacon = {
    timestamp: number,
    token?: string,
    context: EventContext,
    payload: BeaconPayload,
}
