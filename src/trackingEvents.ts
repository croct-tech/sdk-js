import {Patch} from './patch';
import {DistributiveOmit, Optional} from './utilityTypes';

/*
 * Object values
 */

export type ProductDetails = {
    productId: string,
    sku?: string,
    name: string,
    category?: string,
    brand?: string,
    variant?: string,
    displayPrice: number,
    originalPrice?: number,
    url?: string,
    imageUrl?: string,
};

export type CartItem = {
    index: number,
    product: ProductDetails,
    quantity: number,
    total: number,
    discount?: number,
    coupon?: string,
};

export type Cart = {
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
};

export type OrderItem = {
    index: number,
    product: ProductDetails,
    quantity?: number,
    total: number,
    discount?: number,
    coupon?: string,
};

export type OrderStatus = 'placed' | 'paid' | 'completed';

export type Order = {
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
    'goalCompleted',
    'interestShown',
    'postViewed',
    'eventOccurred',
    'linkOpened',
] as const;

export const eventTypes = [
    ...pageEventTypes,
    ...ecommerceEventTypes,
    ...userEventTypes,
    ...miscEventTypes,
] as const;

interface BaseEvent {
    type: string;
}

/*
 * User events
 */

export interface UserProfileChanged extends BaseEvent {
    type: 'userProfileChanged';
    patch: Patch;
}

type Primitive = null | string | number | boolean;
type PrimitiveMap = {[member: string]: Primitive};
type PrimitiveArray = Primitive[];
type TwoLevelMap = {[member: string]: Primitive | PrimitiveMap | PrimitiveArray};
type TwoLevelArray = PrimitiveArray | PrimitiveMap[] | PrimitiveArray[];
type CustomAttribute = Primitive | TwoLevelMap | TwoLevelArray;

export type UserProfile = {
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
    interests?: string[],
    activities?: string[],
    custom?: {
        [member: string]: CustomAttribute,
    },
};

export interface UserSignedUp extends BaseEvent {
    type: 'userSignedUp';
    userId: string;
    profile?: UserProfile;
}

export interface UserSignedIn extends BaseEvent {
    type: 'userSignedIn';
    userId: string;
}

export interface UserSignedOut extends BaseEvent {
    type: 'userSignedOut';
    userId: string;
}

export type IdentifiedUserEvent = UserSignedIn | UserSignedOut | UserSignedUp;
export type UserEvent = UserProfileChanged | IdentifiedUserEvent;

/*
 * E-commerce events
 */

export type CartEventType = typeof cartEventTypes[number];

interface BaseCartEvent extends BaseEvent {
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

export interface OrderPlaced extends BaseEvent {
    type: 'orderPlaced';
    order: Order;
}

export interface ProductViewed extends BaseEvent {
    type: 'productViewed';
    product: ProductDetails;
}

export type EcommerceEvent = OrderPlaced | ProductViewed | CartEvent;

/**
 * Tab event
 */

export type TabEventType = typeof tabEventTypes[number];

interface BaseTabEvent extends BaseEvent {
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

interface BasePageEvent extends BaseEvent {
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

export interface NothingChanged extends BaseEvent {
    type: 'nothingChanged';
    sinceTime: number;
}

export interface SessionAttributesChanged extends BaseEvent {
    type: 'sessionAttributesChanged';
    patch: Patch;
}

export interface GoalCompleted extends BaseEvent {
    type: 'goalCompleted';
    goalId: string;
    value?: number;
    currency?: string;
}

export interface InterestShown extends BaseEvent {
    type: 'interestShown';
    interests: string[];
}

export interface PostDetails {
    postId: string;
    url?: string;
    title: string;
    tags?: string[];
    categories?: string[];
    authors?: string[];
    publishTime: number;
    updateTime?: number;
}

export interface PostViewed extends BaseEvent {
    type: 'postViewed';
    post: PostDetails;
}

export interface EventOccurred extends BaseEvent {
    type: 'eventOccurred';
    name: string;
    label?: string;
    action?: string;
    category?: string;
    details?: {[key: string]: string|number|boolean|null};
}

export interface LinkOpened extends BaseEvent {
    type: 'linkOpened';
    link: string;
}

export type MiscEvent =
      NothingChanged
    | SessionAttributesChanged
    | EventOccurred
    | GoalCompleted
    | InterestShown
    | PostViewed
    | LinkOpened;

type EventMap = {
    // Tab events
    tabVisibilityChanged: TabVisibilityChanged,
    tabUrlChanged: TabUrlChanged,
    tabOpened: TabOpened,
    // Page events
    pageLoaded: PageLoaded,
    pageOpened: PageOpened,
    // User events
    userSignedIn: UserSignedIn,
    userSignedOut: UserSignedOut,
    userSignedUp: UserSignedUp,
    userProfileChanged: UserProfileChanged,
    // E-commerce events
    productViewed: ProductViewed,
    cartViewed: CartViewed,
    cartModified: CartModified,
    checkoutStarted: CheckoutStarted,
    orderPlaced: OrderPlaced,
    // Misc events
    nothingChanged: NothingChanged,
    sessionAttributesChanged: SessionAttributesChanged,
    goalCompleted: GoalCompleted,
    interestShown: InterestShown,
    postViewed: PostViewed,
    eventOccurred: EventOccurred,
    linkOpened: LinkOpened,
};

export type TrackingEventType = keyof EventMap;

export type TrackingEvent<T extends TrackingEventType = TrackingEventType> =
    T extends TrackingEventType ? EventMap[T] : EventMap[TrackingEventType];

/**
 * Partial Events
 */

type CartPartialEvent <T extends CartEvent = CartEvent> =
    DistributiveOmit<T, 'cart'> & Record<'cart', Optional<Cart, 'lastUpdateTime'>>;

export type PartialTrackingEvent = Exclude<TrackingEvent, PageEvent | TabEvent | CartEvent> | CartPartialEvent;

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
    goalCompleted: GoalCompleted,
    interestShown: InterestShown,
    postViewed: PostViewed,
    linkOpened: LinkOpened,
    eventOccurred: EventOccurred,
};

export type ExternalTrackingEventType = keyof ExternalEventMap;

export type ExternalTrackingEvent<T extends ExternalTrackingEventType = ExternalTrackingEventType> =
    T extends ExternalTrackingEventType
        ? ExternalEventMap[T]
        : ExternalEventMap[ExternalTrackingEventType];

export type ExternalTrackingEventPayload<T extends ExternalTrackingEventType> = Omit<ExternalEventMap[T], 'type'>;

/*
 * Type guards
 */

export function isIdentifiedUserEvent(event: TrackingEvent): event is IdentifiedUserEvent {
    return identifiedUserEventTypes.includes((event as IdentifiedUserEvent).type);
}

export function isCartPartialEvent(event: PartialTrackingEvent): event is CartPartialEvent {
    return cartEventTypes.includes((event as CartEvent).type);
}

/*
 * Beacon
 */

export type TrackingEventContext = {
    tabId: string,
    url: string,
    metadata?: {[key: string]: string},
};

export type BeaconPayload =
      Exclude<TrackingEvent, IdentifiedUserEvent>
    // Renames "userId" to "externalUserId"
    | DistributiveOmit<Exclude<IdentifiedUserEvent, UserSignedUp>, 'userId'>
        & Record<'externalUserId', IdentifiedUserEvent['userId']>
    // Renames "userId" to "externalUserId", remove "profile" and add "patch"
    | Omit<UserSignedUp, 'userId' | 'profile'>
        & Record<'externalUserId', IdentifiedUserEvent['userId']>
        & {patch?: Patch};

export type Beacon = {
    timestamp: number,
    token?: string,
    context: TrackingEventContext,
    payload: BeaconPayload,
};
