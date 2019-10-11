import {JsonValue} from './json';
import {compress, decompress} from './compression/lzwUtf16';
import {pack, unpack} from './compression/jsonPack';

export interface Transformer<F, T> {
    (input: F): Promise<T>
}

export const compressJson: Transformer<JsonValue, string> = input => {
    return Promise.resolve(compress(JSON.stringify(pack(input))));
};

export const decompressJson: Transformer<string, JsonValue> = input => {
    const uncompressed = decompress(input);

    let result = null;

    if (uncompressed !== null) {
        result = unpack(JSON.parse(uncompressed));
    }

    return Promise.resolve(result);
};

