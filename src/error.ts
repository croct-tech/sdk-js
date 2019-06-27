export function formatMessage(error: any) : string {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error || 'unknown error');
}

export function formatCause(error: any) {
    const message = formatMessage(error);

    if (message.length === 0) {
        return message;
    }

    return message.charAt(0).toLowerCase() + message.slice(1);
}