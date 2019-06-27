type CommandType = 'updateUserAttributes';

type Metadata<T extends CommandType> = {
    type: T;
    timestamp: number;
}

type PrimitiveAttribute = string | number | boolean | null;

export type UserAttributes = {
    email?: string | null
    firstName?: string | null
    gender?: 'neutral' | 'male' | 'female'
    custom?: {
        [key: string]: PrimitiveAttribute | PrimitiveAttribute[]
    }
}

export type UpdateUserAttributes = Metadata<'updateUserAttributes'> & {
    userToken?: string
    attributes: UserAttributes
}

export type Command =
    UpdateUserAttributes
;