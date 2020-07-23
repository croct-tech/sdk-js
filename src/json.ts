export type JsonPrimitive = string | number | boolean | null;

export type JsonObject = { [member: string]: JsonValue };

export type JsonArray = Array<JsonValue>;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type LenientJsonObject = { [member: string]: LenientJsonValue | undefined };

export type LenientJsonArray = Array<JsonValue>;

export type LenientJsonValue = JsonPrimitive | LenientJsonObject | LenientJsonArray;
