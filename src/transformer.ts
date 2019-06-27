export interface Transformer<F, T> {
    (input: F): Promise<T>
}

export const jsonEncode: Transformer<any, string> = value => {
    return Promise.resolve(JSON.stringify(value));
};

export const utf8Encode: Transformer<string, ArrayBufferLike> = value => {
    return Promise.resolve((new TextEncoder()).encode(value).buffer);
};

export const utf8Decode: Transformer<ArrayBufferLike, string> = value => {
    return Promise.resolve(String.fromCharCode.apply(null, new Uint8Array(value)));
};