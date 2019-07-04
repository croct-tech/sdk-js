import {compress as lzwCompress, decompress as lzwDecompress} from './lzw';

export function compress(input: string | null) : string {
    return lzwCompress(input, 15, code => code + 32)
}

export function decompress(input: string | null) {
    return lzwDecompress(input, 15, code => code - 32);
}