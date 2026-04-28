import { randomBytes } from "crypto";

export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}
