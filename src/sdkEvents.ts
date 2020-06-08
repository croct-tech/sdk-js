import Token from './token/index';

export interface TokenChanged {
    oldToken: Token|null;
    newToken: Token|null;
}

export type SdkEventMap = Record<string, object> & {
    tokenChanged: TokenChanged,
}

export type SdkEventType = keyof SdkEventMap;

export type SdkEvent<T extends SdkEventType = SdkEventType> =
    T extends SdkEventType ? SdkEventMap[T] : SdkEventMap[SdkEventType];
