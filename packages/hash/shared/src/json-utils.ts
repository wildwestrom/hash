import { JsonValue, JsonObject, JsonArray } from "@blockprotocol/core";
import { Schema } from "jsonschema";

export const isParsedJsonObject = (
  val: JsonValue | undefined,
): val is JsonObject =>
  typeof val === "object" && val !== null && !Array.isArray(val);

export const isParsedJsonObjectOrArray = (
  val: JsonValue,
): val is JsonObject | JsonArray =>
  Array.isArray(val) || isParsedJsonObject(val);

export const parseJson = <T extends JsonObject | JsonArray>(
  jsonString: string,
): T => JSON.parse(jsonString);

export type JsonSchema = Schema & {
  configProperties?: string[];
  $defs?: Record<string, JsonSchema>;
  default?: JsonValue;
};

export const primitiveJsonTypes = [
  "boolean",
  "integer",
  "number",
  "null",
  "string",
] as const;
export type PrimitiveJsonType = typeof primitiveJsonTypes[number];
