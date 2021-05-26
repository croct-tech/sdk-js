function extractMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string' && error !== '') {
        return error;
    }

    return 'unknown error';
}

export function formatMessage(error: unknown): string {
    const message = extractMessage(error);

    if (message.length === 0) {
        return message;
    }

    return message.charAt(0).toUpperCase() + message.slice(1);
}

export function formatCause(error: unknown): string {
    const message = formatMessage(error);

    if (message.length === 0) {
        return message;
    }

    return message.charAt(0).toLowerCase() + message.slice(1);
}
