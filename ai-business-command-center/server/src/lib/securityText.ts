import { z } from "zod";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function normalizeUserText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(CONTROL_CHARS, "")
    .trim();
}

export function safeText(max: number, min = 0) {
  return z
    .string()
    .transform(normalizeUserText)
    .pipe(z.string().min(min).max(max));
}

export function optionalSafeText(max: number) {
  return safeText(max).optional().or(z.literal(""));
}

export const cuidParam = z.string().cuid();

export function boundedJsonRecord(maxKeys: number, maxJsonBytes: number) {
  return z
    .record(z.unknown())
    .default({})
    .refine((value) => Object.keys(value).length <= maxKeys, {
      message: `Too many object keys. Maximum is ${maxKeys}.`,
    })
    .refine((value) => Buffer.byteLength(JSON.stringify(value), "utf8") <= maxJsonBytes, {
      message: `Object payload is too large. Maximum is ${maxJsonBytes} bytes.`,
    });
}
