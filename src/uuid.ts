export function uuid4(sortable = false): string {
    let uuid = '';

    if (sortable) {
        const prefix = Date.now()
            .toString(16)
            .padStart(12, '0')
            .substring(0, 12);

        uuid = `${prefix.substring(0, 8)}-${prefix.substring(8, 12)}`;
    }

    for (let index = uuid.length; index < 36; index++) {
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
