import {JsonValue} from './json';
import {compress, decompress} from './compression/lzwUtf16';
import {pack, unpack} from './compression/jsonPack';

export interface Transformer<F, T> {
    (input: F): Promise<T>
}

function size(size: number) : string {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

export const compressJson: Transformer<JsonValue, string> = input => {

    const json = JSON.stringify(input);
    const packed = JSON.stringify(pack(input));
    const compressed = compress(packed);

    const normalLength = json.length;
    const normalSize = normalLength * 2;
    const packedLength = packed.length;
    const packedSize = packedLength * 2;
    const compressedLength = compressed.length;
    const compressedSize = compressedLength * 2;

    console.log('Compressing data...');

    /*console.log(`Normal length: ${normalLength}`);
    console.log(`Normal size: ${size(normalSize)}`);
    console.log(`Packed length: ${packedLength} ${(((packedLength - normalLength) / normalLength) * 100).toFixed(2)}%`);
    console.log(`Packed size: ${size(packedSize)} ${(((packedSize - normalSize) / normalSize) * 100).toFixed(2)}%`);
    console.log(`Compressed length: ${compressedLength} ${(((compressedLength - packedLength) / packedLength) * 100).toFixed(2)}%`);
    console.log(`Compressed size: ${size(compressedSize)} ${(((compressedSize - packedSize) / packedSize) * 100).toFixed(2)}%`);
    console.log(`----`);
    console.log(`Result length: ${compressedLength} ${(((compressedLength - normalLength) / normalLength) * 100).toFixed(2)}%`);*/

    console.log(`Result size: ${size(normalSize)} / ${size(compressedSize)} ${(((compressedSize - normalSize) / normalSize) * 100).toFixed(2)}%`);

    return Promise.resolve(compressed);
};

export const decompressJson: Transformer<string, JsonValue> = input => {
    const uncompressed = decompress(input);

    let result = null;

    if (uncompressed !== null) {
        result = unpack(JSON.parse(uncompressed));
    }

    return Promise.resolve(result);
};

