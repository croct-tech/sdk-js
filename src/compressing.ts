function utf8_encode(out: number[]): Uint8Array {
    var len = out.length;

    // The Uint8Array's length must be at least 3x the length of the string because an invalid UTF-16
    //  takes up the equivelent space of 3 UTF-8 characters to encode it properly
    var resArr = new Uint8Array(len * 3);

    for (var point = 0, nextcode = 0, i = 0, resPos = -1; i !== len;) {
        point = out[i], i += 1;

        if (point >= 0xD800 && point <= 0xDBFF) {
            if (i === len) {
                resArr[resPos += 1] = 0xef/*0b11101111*/;
                resArr[resPos += 1] = 0xbf/*0b10111111*/;
                resArr[resPos += 1] = 0xbd/*0b10111101*/;
                break;
            }
            // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            nextcode = out[i];
            if (nextcode >= 0xDC00 && nextcode <= 0xDFFF) {
                point = (point - 0xD800) * 0x400 + nextcode - 0xDC00 + 0x10000;
                i += 1;
                if (point > 0xffff) {
                    resArr[resPos += 1] = (0x1e/*0b11110*/ << 3) | (point >>> 18);
                    resArr[resPos += 1] = (0x2/*0b10*/ << 6) | ((point >>> 12) & 0x3f/*0b00111111*/);
                    resArr[resPos += 1] = (0x2/*0b10*/ << 6) | ((point >>> 6) & 0x3f/*0b00111111*/);
                    resArr[resPos += 1] = (0x2/*0b10*/ << 6) | (point & 0x3f/*0b00111111*/);
                    continue;
                }
            } else {
                resArr[resPos += 1] = 0xef/*0b11101111*/;
                resArr[resPos += 1] = 0xbf/*0b10111111*/;
                resArr[resPos += 1] = 0xbd/*0b10111101*/;
                continue;
            }
        }
        if (point <= 0x007f) {
            resArr[resPos += 1] = (0x0/*0b0*/ << 7) | point;
        } else if (point <= 0x07ff) {
            resArr[resPos += 1] = (0x6/*0b110*/ << 5) | (point >>> 6);
            resArr[resPos += 1] = (0x2/*0b10*/ << 6) | (point & 0x3f/*0b00111111*/);
        } else {
            resArr[resPos += 1] = (0xe/*0b1110*/ << 4) | (point >>> 12);
            resArr[resPos += 1] = (0x2/*0b10*/ << 6) | ((point >>> 6) & 0x3f/*0b00111111*/);
            resArr[resPos += 1] = (0x2/*0b10*/ << 6) | (point & 0x3f/*0b00111111*/);
        }
    }

    return resArr.subarray(0, resPos + 1);
}

export function encode(input: string): number[] {
    var dict = new Map(); // Use a Map!
    var out = [];
    var currChar;
    var phrase = input[0];
    var code = 256;

    for (let i = 1, length = input.length; i < length; i++) {
        currChar = input[i];

        if (dict.has(phrase + currChar)) {
            phrase += currChar;

            continue;
        }

        out.push(phrase.length > 1 ? dict.get(phrase) : phrase.charCodeAt(0));
        dict.set(phrase + currChar, code);
        code++;
        phrase = currChar;
    }

    out.push(phrase.length > 1 ? dict.get(phrase) : phrase.charCodeAt(0));

    return out;
}

export function decode(input: number[]) {
    var dict = new Map(); // Use a Map!
    var currChar = String.fromCharCode(input[0]);
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;

    for (var i = 1, length = input.length; i < length; i++) {
        var currCode = input[i];

        if (currCode < 256) {
            phrase = String.fromCharCode(currCode);
        } else {
            phrase = dict.has(currCode) ? dict.get(currCode) : (oldPhrase + currChar);
        }

        out.push(phrase);
        currChar = phrase.charAt(0);
        dict.set(code, oldPhrase + currChar);
        code++;
        oldPhrase = phrase;
    }

    return out.join('');
}


console.log(decode(encode('banana é bom')));