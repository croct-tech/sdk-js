export type Violation = {
    path: string
    message: string
}

export type Validator = {
    (data: any) : Violation | null
}

export function format({path, message}: Violation) : string {
    return `The value ${path !== '' ? `of the property '${path}' ` : ''}${message}.`;
}