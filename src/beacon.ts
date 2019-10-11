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

export type UserSignedIn = BasePayload<'userSignedIn'> & {
    token: string
}

export type UserSignedOut = BasePayload<'userSignedOut'> & {
    token: string
}

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