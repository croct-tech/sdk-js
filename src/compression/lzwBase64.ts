import {compress as lzwCompress, decompress as lzwDecompress} from './lzw';

export function compress(input: string | null) : string {
    let result = lzwCompress(input, 6, code => {
        if (code >= 65 && code <= 90) {
            // A-Z
            return code - 65;
        }

        if (code >= 97 && code <= 122) {
            // a-z
            return code - 97 + 26;
        }

        if (code >= 48 && code <= 57) {
            // 0-9
            return code - 48 + 52;
        }

        if (code === 43) {
            // +
            return 62
        }

        if (code === 47) {
            // /
            return 63
        }

        // =
        return 64;
    });

    let padding = result.length % 4;

    while (padding-- > 0) {
        result += '=';
    }

    return result
}

export function decompress(input: string | null) {
    return lzwDecompress(input, 6, code => {
        if (code < 26) {
            // A-Z
            return code + 65;
        }

        if (code < 52) {
            // A-Z
            return code - 26 + 97;
        }

        if (code < 62) {
            // 0-9
            return code - 52 + 48;
        }

        if (code === 62) {
            // +
            return 43
        }

        if (code === 63) {
            // /
            return 47
        }

        // =
        return 61;
    });
}