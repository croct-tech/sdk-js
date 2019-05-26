export function uuid4(): string {
    let uuid = '';

    for (let index = 0; index < 36; index++) {
        switch (index) {
            case 8:
            case 13:
            case 18:
            case 23:
                uuid += '-';
                break;

            case 14:
                // bits 12-15 of the time_hi_and_version field to 0010
                uuid += '4';
                break;

            default: {
                let random = (Math.random() * 16) | 0;

                if (index === 19) {
                    // bits 6-7 of the clock_seq_hi_and_reserved to 01
                    random = (random & 3) | 8;
                }

                uuid += random.toString(16);
            }
        }
    }

    return uuid;
}
