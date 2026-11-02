import { expect, test } from "vitest";
import { getNow } from "./now";
import { isPublished } from "./visibility";

const OVERRIDE = "2026-10-13T08:00:00-06:00";

test("fuera de producción real respeta BLOG_NOW_OVERRIDE", () => {
  expect(getNow({ BLOG_NOW_OVERRIDE: OVERRIDE }).toISOString()).toBe("2026-10-13T14:00:00.000Z");
  expect(getNow({ BLOG_NOW_OVERRIDE: OVERRIDE, VERCEL_ENV: "preview" }).toISOString()).toBe("2026-10-13T14:00:00.000Z");
});

test("en producción real se ignora siempre", () => {
  const before = Date.now();
  const now = getNow({ BLOG_NOW_OVERRIDE: OVERRIDE, VERCEL_ENV: "production" }).getTime();
  expect(now).toBeGreaterThanOrEqual(before);
});

test("una fecha inválida se ignora", () => {
  const before = Date.now();
  expect(getNow({ BLOG_NOW_OVERRIDE: "mañana" }).getTime()).toBeGreaterThanOrEqual(before);
});

test("publishAt = override − 1 min es visible; + 1 min sigue oculto", () => {
  const now = getNow({ BLOG_NOW_OVERRIDE: OVERRIDE });
  expect(isPublished({ publishAt: "2026-10-13T07:59:00-06:00" }, now)).toBe(true);
  expect(isPublished({ publishAt: "2026-10-13T08:01:00-06:00" }, now)).toBe(false);
});
