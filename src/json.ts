export type JsonPrimitive = string | number | boolean | null

export type JsonObject = {[member: string]: JsonValue}

export type JsonArray = Array<JsonValue>

export type JsonValue = JsonPrimitive | JsonObject | JsonArray
